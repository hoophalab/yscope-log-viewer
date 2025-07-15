import {Type} from "@sinclair/typebox";
import {Value} from "@sinclair/typebox/value";
import axios from "axios";

import {Nullable} from "../typings/common";
import {
    CONFIG_KEY,
    ConfigMap,
    ConfigMapSchema,
    ConfigUpdate,
    LocalStorageSettings,
    LocalStorageSettingsSchema,
    Profile,
    ProfileName,
    ProfileRecord,
    THEME_NAME,
} from "../typings/config";
import {TAB_NAME} from "../typings/tab";


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
    record: {},
    activeProfileName: DEFAULT_PROFILE_NAME,
    isFocused: false,
};

class SettingsManager {
    #localStorageKey: string;

    #localStorageSettings: LocalStorageSettings;

    #presetRecord: ProfileRecord;

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

        const serverPreset: ProfileRecord = (await axios.get<ProfileRecord>(serverPresetUrl)).data;

        const prunedLocalStorageRecord: ProfileRecord = SettingsManager.invalidateOutdatedProfiles(
            localStorageSettings.record,
            serverPreset,
        );

        localStorageSettings.record = prunedLocalStorageRecord;
        SettingsManager.setLocalStorageSettings(localStorageKey, localStorageSettings);

        return new SettingsManager(localStorageKey, localStorageSettings, serverPreset);
    }

    static getLocalStorageSettings (localStorageKey: string): Nullable<LocalStorageSettings> {
        const localStorageString = window.localStorage.getItem(localStorageKey);
        if (null === localStorageString) {
            return null;
        }

        return Value.Parse(
            LocalStorageSettingsSchema,
            JSON.parse(localStorageString)
        );
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

        return profile.configUpdate[key] ?? null;
    }

    flushLocalStorageSettings () {
        SettingsManager.setLocalStorageSettings(this.#localStorageKey, this.#localStorageSettings);
    }

    getProfileNames (): ProfileName[] {
        const ret = new Set<ProfileName>();
        for (const name of Object.keys(this.#localStorageKey)) {
            ret.add(name);
        }
        for (const name of Object.keys(this.#presetRecord)) {
            ret.add(name);
        }

        return Array.from(ret);
    }

    isProfileModified (name: ProfileName): boolean {
        return Object.hasOwn(this.#localStorageSettings.record, name);
    }

    getActiveProfileName (): ProfileName {
        return this.#localStorageSettings.activeProfileName;
    }

    setActiveProfileName (name: ProfileName) {
        this.#localStorageSettings.activeProfileName = name;
        this.flushLocalStorageSettings();
    }

    createProfile (name: ProfileName) {
        this.#localStorageSettings.record[name] = {
            configUpdate: {},
            filePathPrefixes: "",
            lastModificationTimestampMillis: Date.now(),
        };
        this.flushLocalStorageSettings();
    }

    removeProfile (name: ProfileName) {
        // We're using an object to store the profile record instead of a `Map`
        // because it simplifies JSON conversion and is natively supported by `sinclair/typeBox`.
        // Therefore, `delete` is necessary here.
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete this.#localStorageSettings.record[name];
        this.flushLocalStorageSettings();
    }

    getConfig<T extends CONFIG_KEY>(key: T): ConfigMap[T] {
        const activeProfileName: ProfileName = this.getActiveProfileName();
        let ret: Nullable<ConfigMap[T]>;
        ret = SettingsManager.#getConfigFromRecord(
            this.#localStorageSettings.record,
            activeProfileName,
            key
        );
        if (null !== ret) {
            return ret;
        }
        ret = SettingsManager.#getConfigFromRecord(this.#presetRecord, activeProfileName, key);
        if (null !== ret) {
            return ret;
        }
        ret = SettingsManager.#getConfigFromRecord(this.#presetRecord, DEFAULT_PROFILE_NAME, key);
        if (null !== ret) {
            return ret;
        }

        return CONFIG_DEFAULT[key];
    }

    setConfig (update: ConfigUpdate) {
        const activeProfileName = this.getActiveProfileName();
        if (false === this.isProfileModified(activeProfileName)) {
            this.createProfile(activeProfileName);
        }
        const profile: Profile | undefined = this.#localStorageSettings.record[activeProfileName];
        if ("undefined" === typeof profile) {
            throw new Error("unreachable");
        }
        for (const [key, value] of Object.entries(update)) {
            profile.configUpdate[key as keyof ConfigMap] = Value.Parse(
                Type.Index(ConfigMapSchema, Type.Literal(key)),
                value,
            );
        }
        this.flushLocalStorageSettings();
    }
}

const settingsManager = await SettingsManager.create("yscope-log-viewer", "profile-presets.json");

/**
 * Updates the config denoted by the given key and value.
 *
 * @param configUpdate
 * @return `null` if the update succeeds, or an error message otherwise.
 */
const setConfig = (configUpdate: ConfigUpdate): Nullable<string> => {
    try {
        settingsManager.setConfig(configUpdate);

        return null;
    } catch (e: unknown) {
        return `Failed to set config: ${e instanceof Error ?
            e.message :
            JSON.stringify(e)}.`;
    }
};

/**
 * Retrieves the config value for the specified key.
 *
 * @param key
 * @return The value.
 */
const getConfig = <T extends CONFIG_KEY>(key: T): ConfigMap[T] => {
    return settingsManager.getConfig(key);
};

export {
    CONFIG_DEFAULT,
    getConfig,
    setConfig,
};
