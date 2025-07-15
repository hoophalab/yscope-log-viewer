import {useSyncExternalStore} from "react";

import {
    FormControl,
    FormHelperText,
    FormLabel,
    IconButton,
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

import useViewStore from "../../../../../stores/viewStore";
import {ProfileName} from "../../../../../typings/config";
import {ACTION_NAME} from "../../../../../utils/actions";
import {settingsManager} from "../../../../../utils/config";
import CreateProfileButton from "./CreateProfileButton";


interface ProfileControlsProps {
    selectedProfileName: ProfileName;
}

/**
 * Displays profile-related settings controls.
 *
 * @param props
 * @param props.selectedProfileName
 * @return
 */
const ProfileControls = ({selectedProfileName}: ProfileControlsProps) => {
    const isForced = useSyncExternalStore(
        (onStoreChange) => {
            return settingsManager.subscribe(onStoreChange);
        },
        () => {
            return settingsManager.getIsForced();
        },
    );

    const profileNames = settingsManager.getProfileNames();

    return (
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
                        if (null === newProfileName || "string" !== typeof newProfileName) {
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
                                {settingsManager.getActiveProfileName() === profileName && (
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
                                    const {loadPageByAction} = useViewStore.getState();
                                    loadPageByAction({code: ACTION_NAME.RELOAD, args: null});
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
                            throw new Error(
                                `Failed to create a new profile: ${
                                    e instanceof Error ?
                                        e.message :
                                        JSON.stringify(e)
                                }`,
                            );
                        }
                    }}/>
            </Stack>
            <FormHelperText>Below fields are managed by the selected profile.</FormHelperText>
        </FormControl>
    );
};
export default ProfileControls;
