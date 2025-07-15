import {useState} from "react";

import {
    Dropdown,
    FormControl,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    Stack,
} from "@mui/joy";
import {Value} from "@sinclair/typebox/value";

import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";

import {
    ProfileName,
    ProfileNameSchema,
} from "../../../../../typings/config";

import "./index.css";


interface CreateProfileButtonProps {
    onCreateProfile: (profileName: ProfileName) => void;
}

/**
 * Renders a button for creating new profiles.
 *
 * @param props
 * @param props.onCreateProfile
 * @return
 */
const CreateProfileButton = ({onCreateProfile}: CreateProfileButtonProps) => {
    const [newProfileName, setNewProfileName] = useState<string>("");
    const profileNameValid = Value.Check(ProfileNameSchema, newProfileName);

    return (
        <Dropdown>
            <MenuButton
                size={"sm"}
                sx={{paddingInline: "6px"}}
                variant={"soft"}
            >
                <AddIcon/>
            </MenuButton>
            <Menu
                placement={"bottom-end"}
                size={"sm"}
            >
                <Stack
                    direction={"row"}
                    paddingInline={1}
                    spacing={1}
                >
                    <FormControl>
                        <Input
                            name={"newProfileName"}
                            placeholder={"New Profile Name"}
                            size={"sm"}
                            sx={{minWidth: "24ch"}}
                            value={newProfileName}
                            onChange={(ev) => {
                                setNewProfileName(ev.target.value);
                                setTimeout(() => {
                                    ev.target.focus();
                                }, 0);
                            }}/>
                    </FormControl>
                    <MenuItem
                        disabled={false === profileNameValid}
                        sx={{borderRadius: "2px"}}
                        onClick={() => {
                            if (false === profileNameValid) {
                                return;
                            }
                            onCreateProfile(newProfileName);
                            setNewProfileName("");
                        }}
                    >
                        <CheckIcon/>
                    </MenuItem>
                </Stack>
            </Menu>
        </Dropdown>
    );
};

export default CreateProfileButton;
