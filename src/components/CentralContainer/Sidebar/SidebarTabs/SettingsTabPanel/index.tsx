import React, {
    useCallback,
    useEffect,
    useState,
    useSyncExternalStore,
} from "react";

import {
    Box,
    Button,
    Divider,
} from "@mui/joy";

import useNotificationStore from "../../../../../stores/notificationStore";
import useViewStore from "../../../../../stores/viewStore";
import {Nullable} from "../../../../../typings/common";
import {
    CONFIG_KEY,
    ConfigMap,
    ProfileName,
} from "../../../../../typings/config";
import {LOG_LEVEL} from "../../../../../typings/logs";
import {DO_NOT_TIMEOUT_VALUE} from "../../../../../typings/notifications";
import {
    TAB_DISPLAY_NAMES,
    TAB_NAME,
} from "../../../../../typings/tab";
import {ACTION_NAME} from "../../../../../utils/actions";
import {
    getConfig,
    setConfig,
    settingsManager,
} from "../../../../../utils/config";
import CustomTabPanel from "../CustomTabPanel";
import ConfigInput from "./ConfigInput";
import ProfileControls from "./ProfileControls";
import ThemeSwitchFormField from "./ThemeSwitchFormField";
import {
    GLOBAL_CONFIG_DESCRIPTIONS,
    PROFILE_MANAGED_CONFIG_DESCRIPTIONS,
} from "./utils";

import "./index.css";


/**
 * Sets a configuration value if and only if it differs from the currently stored value.
 *
 * @param key
 * @param value
 * @param profileName
 * @return
 */
const setConfigIfChanged = <T extends CONFIG_KEY>(
    key: T,
    value: ConfigMap[T],
    profileName: Nullable<ProfileName> = null,
): Nullable<string> => {
    const oldValue = settingsManager.getConfig(key, profileName);
    if (oldValue !== value) {
        return setConfig(key, value, profileName);
    }

    return null;
};

/**
 * Handles the reset event for the configuration form.
 *
 * @param ev
 */
const handleConfigFormReset = (ev: React.FormEvent) => {
    ev.preventDefault();
    window.localStorage.clear();
    window.location.reload();
};

/**
 * Displays a setting tab panel for configurations.
 *
 * @return
 */
const SettingsTabPanel = () => {
    const [canApply, setCanApply] = useState<boolean>(false);

    const [settingsVersion, setSettingsVersion] = useState<number>(0);
    const handleConfigValuesChanged = useCallback(() => {
        setSettingsVersion(settingsVersion + 1);
    }, [settingsVersion]);

    useEffect(() => {
        return settingsManager.subscribe(handleConfigValuesChanged);
    }, [handleConfigValuesChanged]);

    const activeProfileName = useSyncExternalStore((onStoreChange) => {
        return settingsManager.subscribe(onStoreChange);
    }, () => {
        return settingsManager.getActiveProfileName();
    });

    // We currently reload the page when `activeProfileName` changes or a profile is deleted.
    // Ideally, we'd use `settingsVersion` to refresh on config updates.
    // However, `resetCachedPageSize` in `components/Editor/index.tsx` updates `settingsVersion`
    // on reload, which creates an infinite loop.
    useEffect(() => {
        const {loadPageByAction} = useViewStore.getState();
        loadPageByAction({code: ACTION_NAME.RELOAD, args: null});
    }, [activeProfileName]);

    const handleConfigFormSubmit = useCallback(
        (ev: React.FormEvent) => {
            ev.preventDefault();
            const formData = new FormData(ev.target as HTMLFormElement);
            const getFormDataValue = (key: string) => formData.get(key) as string;

            const formatString = getFormDataValue(CONFIG_KEY.DECODER_FORMAT_STRING);
            const logLevelKey = getFormDataValue(CONFIG_KEY.DECODER_LOG_LEVEL_KEY);
            const timestampFormatString = getFormDataValue(
                CONFIG_KEY.DECODER_TIMESTAMP_FORMAT_STRING,
            );
            const timestampKey = getFormDataValue(CONFIG_KEY.DECODER_TIMESTAMP_KEY);
            const pageSize = getFormDataValue(CONFIG_KEY.PAGE_SIZE);

            let error: Nullable<string> = setConfigIfChanged(
                CONFIG_KEY.DECODER_FORMAT_STRING,
                formatString,
            );

            error ||= setConfigIfChanged(CONFIG_KEY.DECODER_LOG_LEVEL_KEY, logLevelKey);
            error ||= setConfigIfChanged(
                CONFIG_KEY.DECODER_TIMESTAMP_FORMAT_STRING,
                timestampFormatString,
            );
            error ||= setConfigIfChanged(CONFIG_KEY.DECODER_TIMESTAMP_KEY, timestampKey);
            error ||= setConfigIfChanged(CONFIG_KEY.PAGE_SIZE, Number(pageSize));

            if (null !== error) {
                const {postPopUp} = useNotificationStore.getState();
                postPopUp({
                    level: LOG_LEVEL.ERROR,
                    message: error,
                    timeoutMillis: DO_NOT_TIMEOUT_VALUE,
                    title: "Unable to apply config.",
                });
            } else {
                setCanApply(false);
                const {loadPageByAction} = useViewStore.getState();
                loadPageByAction({code: ACTION_NAME.RELOAD, args: null});
            }
        },
        [],
    );

    return (
        <CustomTabPanel
            tabName={TAB_NAME.SETTINGS}
            title={TAB_DISPLAY_NAMES[TAB_NAME.SETTINGS]}
        >
            <form
                className={"settings-tab-container"}
                tabIndex={-1}
                onReset={handleConfigFormReset}
                onSubmit={handleConfigFormSubmit}
                onChange={(ev) => {
                    try {
                        const inputElement = ev.target as HTMLInputElement;
                        if ("newProfileName" !== inputElement.name) {
                            setCanApply(true);
                        }
                    } catch (e: unknown) {
                        console.log(`Settings form changed casued by a element without name: ${
                            e instanceof Error ?
                                e.message :
                                JSON.stringify(e)}`);
                    }
                }}
            >
                <Box className={"settings-form-fields-container"}>
                    <ThemeSwitchFormField/>

                    {GLOBAL_CONFIG_DESCRIPTIONS.map((desc) => (
                        <ConfigInput
                            initialValue={String(getConfig(desc.name))}
                            key={`${desc.name} ${settingsVersion}`}
                            profileName={null}
                            {...desc}/>
                    ))}
                    <ProfileControls selectedProfileName={activeProfileName}/>
                    {PROFILE_MANAGED_CONFIG_DESCRIPTIONS.map((desc) => (
                        <ConfigInput
                            initialValue={String(getConfig(desc.name))}
                            key={`${desc.name} ${settingsVersion}`}
                            profileName={activeProfileName}
                            {...desc}/>
                    ))}
                </Box>
                <Divider/>
                <Button
                    color={"primary"}
                    disabled={false === canApply}
                    type={"submit"}
                >
                    Apply
                </Button>
                <Button
                    color={"neutral"}
                    type={"reset"}
                >
                    Reset Default
                </Button>
            </form>
        </CustomTabPanel>
    );
};

export default SettingsTabPanel;
