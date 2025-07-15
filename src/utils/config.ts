import {Nullable} from "../typings/common";
import {
    CONFIG_KEY,
    ConfigMap,
    ProfileName,
} from "../typings/config";
import {
    CONFIG_DEFAULT,
    DEFAULT_PROFILE_NAME,
    SettingsManager,
} from "./settingsManager";


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
