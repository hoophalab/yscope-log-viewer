import {Type} from "@sinclair/typebox";
import {Value} from "@sinclair/typebox/value";
import axios from "axios";

import {Nullable} from "../typings/common";
import {
    CONFIG_KEY,
    ConfigMap,
    ConfigMapSchema,
    LocalStorageSettings,
    LocalStorageSettingsSchema,
    Profile,
    ProfileName,
    ProfileNameSchema,
    ProfileRecord,
    ProfileRecordSchema,
    THEME_NAME,
} from "../typings/config";
import {TAB_NAME} from "../typings/tab";
import {FileSrcType} from "../typings/worker";


/**
 * The default configuration values.
 */
const CONFIG_DEFAULT: ConfigMap = Object.freeze({
    [CONFIG_KEY.DECODER_FORMAT_STRING]: "",
    [CONFIG_KEY.DECODER_LOG_LEVEL_KEY]: "log.level",
    [CONFIG_KEY.DECODER_TIMESTAMP_FORMAT_STRING]: "YYYY-MM-DDTHH:mm:ss.SSSZ",
    [CONFIG_KEY.DECODER_TIMESTAMP_KEY]: "timestamp",
    [CONFIG_KEY.INITIAL_TAB_NAME]: TAB_NAME.FILE_INFO,
    [CONFIG_KEY.THEME]: THEME_NAME.SYSTEM,
    [CONFIG_KEY.PAGE_SIZE]: 10_000,
});

const DEFAULT_PROFILE_NAME: ProfileName = "default";
const DEFAULT_LOCAL_STORAGE_SETTINGS: LocalStorageSettings = {
    profileConfigs: {},
    globalConfig: {},
    activeProfileName: DEFAULT_PROFILE_NAME,
    isForced: false,
};

const PROFILE_MANAGED_KEYS: CONFIG_KEY[] = [
    CONFIG_KEY.DECODER_FORMAT_STRING,
    CONFIG_KEY.DECODER_LOG_LEVEL_KEY,
    CONFIG_KEY.DECODER_TIMESTAMP_FORMAT_STRING,
    CONFIG_KEY.DECODER_TIMESTAMP_KEY,
];

class SettingsManager {
    #localStorageKey: string;

    #localStorageSettings: LocalStorageSettings;

    #presetRecord: ProfileRecord;

    #listeners: Map<number, () => void> = new Map();

    #nextListenerId: number = 0;

    constructor (
        localStorageKey: string,
        localStorageSettings: LocalStorageSettings,
        preset: ProfileRecord,
    ) {
        this.#localStorageKey = localStorageKey;
        this.#localStorageSettings = localStorageSettings;
        this.#presetRecord = preset;
    }

    static async create (
        localStorageKey: string,
        serverPresetUrl: string,
    ): Promise<SettingsManager> {
        const localStorageSettings: LocalStorageSettings =
            SettingsManager.getLocalStorageSettings(localStorageKey) ??
            DEFAULT_LOCAL_STORAGE_SETTINGS;

        let serverPreset: ProfileRecord = (await axios.get<ProfileRecord>(serverPresetUrl)).data;
        try {
            serverPreset = Value.Parse(ProfileRecordSchema, serverPreset);
        } catch (e: unknown) {
            throw new Error(
                `Invalid server preset: ${e instanceof Error ?
                    e.message :
                    JSON.stringify(e)}.`,
            );
        }

        const prunedLocalStorageRecord: ProfileRecord = SettingsManager.invalidateOutdatedProfiles(
            localStorageSettings.profileConfigs,
            serverPreset,
        );

        localStorageSettings.profileConfigs = prunedLocalStorageRecord;
        SettingsManager.setLocalStorageSettings(localStorageKey, localStorageSettings);

        return new SettingsManager(localStorageKey, localStorageSettings, serverPreset);
    }

    static getLocalStorageSettings (localStorageKey: string): Nullable<LocalStorageSettings> {
        const localStorageString = window.localStorage.getItem(localStorageKey);
        if (null === localStorageString) {
            return null;
        }

        return Value.Parse(LocalStorageSettingsSchema, JSON.parse(localStorageString));
    }

    static setLocalStorageSettings (
        localStorageKey: string,
        localStorageSettings: LocalStorageSettings,
    ): void {
        window.localStorage.setItem(localStorageKey, JSON.stringify(localStorageSettings));
    }

    static invalidateOutdatedProfiles (
        target: ProfileRecord,
        preset: ProfileRecord
    ): ProfileRecord {
        const ret: ProfileRecord = {};
        for (const [name, profile] of Object.entries(target)) {
            let keepProfile: boolean;
            if (Object.hasOwn(preset, name)) {
                const targetProfile: Profile | undefined = target[name];
                const presetProfile: Profile | undefined = preset[name];
                if ("undefined" === typeof targetProfile || "undefined" === typeof presetProfile) {
                    throw new Error("unreachable");
                }
                keepProfile =
                    targetProfile.lastModificationTimestampMillis >
                    presetProfile.lastModificationTimestampMillis;
            } else {
                keepProfile = true;
            }

            if (keepProfile) {
                ret[name] = profile;
            }
        }

        return ret;
    }

    static #getConfigFromRecord<T extends CONFIG_KEY>(
        record: ProfileRecord,
        profileName: ProfileName,
        key: T,
    ): Nullable<ConfigMap[T]> {
        const profile: Profile | undefined = record[profileName];
        if ("undefined" === typeof profile) {
            return null;
        }

        return profile.config[key] ?? null;
    }

    flushLocalStorageSettings () {
        SettingsManager.setLocalStorageSettings(this.#localStorageKey, this.#localStorageSettings);
        for (const listener of this.#listeners.values()) {
            listener();
        }
    }

    addListener (listener:() => void): number {
        const id = this.#nextListenerId;
        this.#listeners.set(id, listener);
        this.#nextListenerId += 1;

        return id;
    }

    removeListener (id: number) {
        this.#listeners.delete(id);
    }

    subscribe (onStoreChange:() => void):() => void {
        const id = this.addListener(onStoreChange);
        return () => {
            this.removeListener(id);
        };
    }

    getProfileNames (): ProfileName[] {
        const ret = new Set<ProfileName>();
        for (const name of Object.keys(this.#localStorageSettings.profileConfigs)) {
            ret.add(name);
        }
        for (const name of Object.keys(this.#presetRecord)) {
            ret.add(name);
        }

        return Array.from(ret);
    }

    isProfileModified (name: ProfileName): boolean {
        return Object.hasOwn(this.#localStorageSettings.profileConfigs, name);
    }

    getActiveProfileName (): ProfileName {
        return this.#localStorageSettings.activeProfileName;
    }

    setActiveProfileName (name: ProfileName) {
        this.#localStorageSettings.activeProfileName = name;
        this.flushLocalStorageSettings();
    }

    createProfile (name: ProfileName) {
        name = Value.Parse(ProfileNameSchema, name);
        this.#localStorageSettings.profileConfigs[name] = {
            config: {},
            filePathRegExps: [],
            lastModificationTimestampMillis: Date.now(),
        };
        this.flushLocalStorageSettings();
    }

    removeProfile (name: ProfileName) {
        // We're using an object to store the profile record instead of a `Map`
        // because it simplifies JSON conversion and is natively supported by `sinclair/typeBox`.
        // Therefore, `delete` is necessary here.
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.#localStorageSettings.profileConfigs[name];
        if (this.#localStorageSettings.activeProfileName === name &&
            false === Object.hasOwn(this.#presetRecord, name)) {
            this.#localStorageSettings.activeProfileName = DEFAULT_PROFILE_NAME;
        }
        this.flushLocalStorageSettings();
    }

    getConfig<T extends CONFIG_KEY>(
        key: T,
        profileName: Nullable<ProfileName> = null,
    ): ConfigMap[T] {
        profileName = null === profileName ?
            this.getActiveProfileName() :
            profileName;
        let ret: Nullable<ConfigMap[T]>;
        ret = SettingsManager.#getConfigFromRecord(
            this.#localStorageSettings.profileConfigs,
            profileName,
            key,
        );
        if (null !== ret) {
            return ret;
        }
        ret = SettingsManager.#getConfigFromRecord(this.#presetRecord, profileName, key);
        if (null !== ret) {
            return ret;
        }
        ret = SettingsManager.#getConfigFromRecord(this.#presetRecord, DEFAULT_PROFILE_NAME, key);
        if (null !== ret) {
            return ret;
        }

        return CONFIG_DEFAULT[key];
    }

    setConfig<T extends CONFIG_KEY>(
        key: T,
        value: ConfigMap[T],
        profileName: Nullable<ProfileName> = null,
    ) {
        const configKey: CONFIG_KEY = key;
        if (PROFILE_MANAGED_KEYS.includes(key)) {
            profileName = null === profileName ?
                this.getActiveProfileName() :
                profileName;
            if (false === this.isProfileModified(profileName)) {
                this.createProfile(profileName);
            }
            const profile: Profile | undefined =
                this.#localStorageSettings.profileConfigs[profileName];

            if ("undefined" === typeof profile) {
                throw new Error("unreachable");
            }
            profile.config[configKey] = Value.Parse(
                Type.Index(ConfigMapSchema, Type.Literal(key)),
                value,
            );
        } else {
            this.#localStorageSettings.globalConfig[configKey] = Value.Parse(
                Type.Index(ConfigMapSchema, Type.Literal(key)),
                value,
            );
        }
        this.flushLocalStorageSettings();
    }

    setIsForced (isFocused: boolean) {
        this.#localStorageSettings.isForced = isFocused;
        this.flushLocalStorageSettings();
    }

    getIsForced (): boolean {
        return this.#localStorageSettings.isForced;
    }

    resolveProfileName (fileSrc: FileSrcType): ProfileName {
        if (this.getIsForced()) {
            return this.getActiveProfileName();
        }
        if ("string" !== typeof fileSrc) {
            return DEFAULT_PROFILE_NAME;
        }
        const matchedProfileNames: ProfileName[] = [];
        for (const [profileName, profile] of Object.entries(this.#presetRecord)) {
            for (const regExpString of profile.filePathRegExps) {
                const regExp = new RegExp(regExpString);
                if (null !== fileSrc.match(regExp)) {
                    matchedProfileNames.push(profileName);
                    break;
                }
            }
        }
        switch (matchedProfileNames.length) {
            case 0:
                return DEFAULT_PROFILE_NAME;
            case 1:
                return matchedProfileNames[0] ?? DEFAULT_PROFILE_NAME;
            default:
                console.log(
                    `Multiple profile matches the file src: ${String(matchedProfileNames)}`,
                );

                return matchedProfileNames[0] ?? DEFAULT_PROFILE_NAME;
        }
    }
}

const settingsManager = await SettingsManager.create("yscope-log-viewer", "profile-presets.json");

/**
 * Updates the config denoted by the given key and value.
 *
 * @param key
 * @param value
 * @param profileName
 * @return `null` if the update succeeds, or an error message otherwise.
 */
const setConfig = <T extends CONFIG_KEY>(
    key: T,
    value: ConfigMap[T],
    profileName: Nullable<ProfileName> = null,
): Nullable<string> => {
    try {
        settingsManager.setConfig(key, value, profileName);

        return null;
    } catch (e: unknown) {
        return `Failed to set config with key ${key}: ${
            e instanceof Error ?
                e.message :
                JSON.stringify(e)
        }.`;
    }
};

/**
 * Retrieves the config value for the specified key.
 *
 * @param key
 * @param profileName
 * @return The value.
 */
const getConfig = <T extends CONFIG_KEY>(
    key: T,
    profileName: Nullable<ProfileName> = null,
): ConfigMap[T] => {
    return settingsManager.getConfig(key, profileName);
};

export {
    CONFIG_DEFAULT, DEFAULT_PROFILE_NAME, getConfig, setConfig, settingsManager,
};
