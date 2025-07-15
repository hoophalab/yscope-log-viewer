import {Value} from "@sinclair/typebox/value";

import {Nullable} from "../../typings/common";
import {
    CONFIG_KEY,
    ConfigMap,
    LocalStorageSettings,
    LocalStorageSettingsSchema,
    Profile,
    ProfileName,
    ProfileRecord,
} from "../../typings/config";


/**
 * Retrieves and parses local storage settings from the given key.
 *
 * @param localStorageKey
 * @return
 */
const getLocalStorageSettings = (localStorageKey: string): Nullable<LocalStorageSettings> => {
    const localStorageString = window.localStorage.getItem(localStorageKey);
    if (null === localStorageString) {
        return null;
    }

    return Value.Parse(LocalStorageSettingsSchema, JSON.parse(localStorageString));
};

/**
 * Retrieves and parses local storage settings from the given key.
 *
 * @param localStorageKey
 * @param localStorageSettings
 */
const setLocalStorageSettings = (
    localStorageKey: string,
    localStorageSettings: LocalStorageSettings,
): void => {
    window.localStorage.setItem(localStorageKey, JSON.stringify(localStorageSettings));
};

/**
 * Compares two profile records and filters out profiles from the target
 * that are outdated compared to the preset.
 *
 * @param target
 * @param preset
 * @return
 * @throws
 */
const invalidateOutdatedProfiles = (
    target: ProfileRecord,
    preset: ProfileRecord,
): ProfileRecord => {
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
};

/**
 * Retrieves a specific configuration value from a profile in a profile record.
 *
 * @param record
 * @param profileName
 * @param key
 * @return
 */
const getConfigFromRecord = <T extends CONFIG_KEY>(
    record: ProfileRecord,
    profileName: ProfileName,
    key: T,
): Nullable<ConfigMap[T]> => {
    const profile: Profile | undefined = record[profileName];
    if ("undefined" === typeof profile) {
        return null;
    }

    return profile.config[key] ?? null;
};

export {
    getConfigFromRecord,
    getLocalStorageSettings,
    invalidateOutdatedProfiles,
    setLocalStorageSettings,
};
