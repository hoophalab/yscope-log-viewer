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
    FormControl,
    FormHelperText,
    FormLabel,
    IconButton,
    Link,
    Option,
    Select,
    Stack,
    ToggleButtonGroup,
    Tooltip,
    Typography,
} from "@mui/joy";

import CheckBoxIcon from "@mui/icons-material/CheckBox";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import SdStorageIcon from "@mui/icons-material/SdStorage";

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
import ConfigInput, {ConfigInputProps, as CONFIG_INPUT_TYPE} from "./ConfigInput";
import CreateProfileButton from "./CreateProfileButton";
import ThemeSwitchFormField from "./ThemeSwitchFormField";

import "./index.css";


interface ConfigDescription {
    description: React.ReactElement;
    configKey: CONFIG_KEY;
    label: string;
    inputType: CONFIG_INPUT_TYPE;
}

const GOBAL_CONFIG_DESCRIPTIONS: ConfigDescription[] = [
    {
        description: <span>Number of log messages to display per page.</span>,
        label: "View: Page size",
        configKey: CONFIG_KEY.PAGE_SIZE,
        inputType: CONFIG_INPUT_TYPE.number,
    },
];

const PROFILE_MANAGED_CONFIG_DESCRIPTIONS: ConfigDescription[] = [
    {
        description: (
            <span>
                [Structured] Format string for formatting a structured log event as plain text.
                Leave blank to display the entire log event. See
                {" "}
                <Link
                    href={"https://docs.yscope.com/yscope-log-viewer/main/user-guide/struct-logs/format/index.html"}
                    level={"body-sm"}
                    rel={"noopener"}
                    target={"_blank"}
                >
                    here
                </Link>
                {" "}
                for syntax.
            </span>
        ),
        label: "Decoder: Format string",
        configKey: CONFIG_KEY.DECODER_FORMAT_STRING,
        inputType: CONFIG_INPUT_TYPE.string,
    },
    {
        description: (
            <span>
                [Structured] Key that maps to each log event&apos;s log level. See
                {" "}
                <Link
                    href={"https://docs.yscope.com/yscope-log-viewer/main/user-guide/struct-logs/specifying-keys.html#syntax"}
                    level={"body-sm"}
                    rel={"noopener"}
                    target={"_blank"}
                >
                    here
                </Link>
                {" "}
                for syntax.
            </span>
        ),
        label: "Decoder: Log level key",
        configKey: CONFIG_KEY.DECODER_LOG_LEVEL_KEY,
        inputType: CONFIG_INPUT_TYPE.string,
    },
    {
        description: (
            <span>
                [Structured] Key that maps to each log event&apos;s timestamp. See
                {" "}
                <Link
                    href={"https://docs.yscope.com/yscope-log-viewer/main/user-guide/struct-logs/specifying-keys.html#syntax"}
                    level={"body-sm"}
                    rel={"noopener"}
                    target={"_blank"}
                >
                    here
                </Link>
                {" "}
                for syntax.
            </span>
        ),
        label: "Decoder: Timestamp key",
        configKey: CONFIG_KEY.DECODER_TIMESTAMP_KEY,
        inputType: CONFIG_INPUT_TYPE.string,
    },
    {
        description: <span>[Unstructured-IR] Format string for timestamps in Day.js format.</span>,
        label: "Decoder: Timestamp format string",
        configKey: CONFIG_KEY.DECODER_TIMESTAMP_FORMAT_STRING,
        inputType: CONFIG_INPUT_TYPE.string,
    },
];

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
    const {loadPageByAction} = useViewStore.getState();
    const [selectedProfileName, setSelectedProfileName] = useState<ProfileName>(
        settingsManager.getActiveProfileName(),
    );
    const [canApply, setCanApply] = useState<boolean>(false);

    const [settingsVersion, setSettingsVersion] = useState<number>(0);
    const handleConfigValuesChanged = useCallback(() => {
        setSettingsVersion(settingsVersion + 1);
    }, [settingsVersion]);

    const isForced = useSyncExternalStore((onStoreChange) => {
        return settingsManager.subscribe(onStoreChange);
    }, () => {
        return settingsManager.getIsForced();
    });

    const activeProfileName = useSyncExternalStore((onStoreChange) => {
        return settingsManager.subscribe(onStoreChange);
    }, () => {
        return settingsManager.getActiveProfileName();
    });

    const profileNames = settingsManager.getProfileNames();

    useEffect(() => {
        return settingsManager.subscribe(handleConfigValuesChanged);
    }, [loadPageByAction,
        handleConfigValuesChanged]);

    useEffect(() => {
        setSelectedProfileName(activeProfileName);
        loadPageByAction({code: ACTION_NAME.RELOAD, args: null});
    }, [loadPageByAction,
        activeProfileName]);

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

            settingsManager.setActiveProfileName(selectedProfileName);

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
                loadPageByAction({code: ACTION_NAME.RELOAD, args: null});
            }
        },
        [loadPageByAction,
            selectedProfileName],
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
            >
                <Box className={"settings-form-fields-container"}>
                    <ThemeSwitchFormField/>

                    {getGlobalFormFields().map((props) => (
                        <ConfigInput
                            key={`${props.name} ${settingsVersion}`}
                            {...props}/>
                    ))}
                    <FormControl>
                        <FormLabel>Profile</FormLabel>
                        <Stack
                            direction={"row"}
                            gap={0.3}
                        >
                            <Select
                                name={"selectedProfile"}
                                size={"sm"}
                                sx={{flexGrow: 1}}
                                value={selectedProfileName}
                                onChange={(_, newProfileName) => {
                                    if (
                                        null === newProfileName ||
                                        "string" !== typeof newProfileName
                                    ) {
                                        throw new Error(`Unexpected newValue: ${newProfileName}`);
                                    }
                                    settingsManager.setActiveProfileName(newProfileName);
                                }}
                            >
                                {Array.from(profileNames).map((profileName) => (
                                    <Option
                                        key={profileName}
                                        value={profileName}
                                    >
                                        <Typography sx={{flexGrow: 1}}>
                                            {profileName}
                                        </Typography>
                                        <Stack
                                            direction={"row"}
                                            gap={1}
                                        >
                                            {settingsManager.getActiveProfileName() ===
                                                profileName && (
                                                <Tooltip title={"Active"}>
                                                    <CheckBoxIcon/>
                                                </Tooltip>
                                            )}
                                            {settingsManager.isProfileModified(profileName) && (
                                                <Tooltip title={"Locally stored"}>
                                                    <SdStorageIcon/>
                                                </Tooltip>
                                            )}
                                        </Stack>
                                    </Option>
                                ))}
                            </Select>
                            <Tooltip title={"Force the profile on all file paths"}>
                                <ToggleButtonGroup
                                    size={"sm"}
                                    spacing={0.1}
                                    variant={"soft"}
                                    value={[isForced ?
                                        "forced" :
                                        ""]}
                                >
                                    <IconButton
                                        value={"forced"}
                                        variant={"soft"}
                                        onClick={() => {
                                            settingsManager.setIsForced(!isForced);
                                        }}
                                    >
                                        <LockIcon/>
                                    </IconButton>
                                </ToggleButtonGroup>
                            </Tooltip>

                            {settingsManager.isProfileModified(selectedProfileName) && (
                                <Tooltip title={"Delete this profile"}>
                                    {
                                        <IconButton
                                            size={"sm"}
                                            value={"forced"}
                                            variant={"soft"}
                                            onClick={() => {
                                                settingsManager.removeProfile(selectedProfileName);
                                                loadPageByAction({
                                                    code: ACTION_NAME.RELOAD,
                                                    args: null,
                                                });
                                            }}
                                        >
                                            <DeleteIcon/>
                                        </IconButton>
                                    }
                                </Tooltip>
                            )}
                            <CreateProfileButton
                                onCreateProfile={(newProfileName) => {
                                    try {
                                        settingsManager.createProfile(newProfileName);
                                        settingsManager.setActiveProfileName(newProfileName);
                                    } catch (e: unknown) {
                                        throw new Error(`Failed to create a new profile: ${
                                            e instanceof Error ?
                                                e.message :
                                                JSON.stringify(e)}`);
                                    }
                                }}/>
                        </Stack>
                        <FormHelperText>
                            Below fields are managed by the selected profile.
                        </FormHelperText>
                    </FormControl>

                    {getProfileManagedFormFields(selectedProfileName).map((props) => (
                        <ConfigInput
                            key={`${props.name} ${settingsVersion}`}
                            {...props}/>
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
