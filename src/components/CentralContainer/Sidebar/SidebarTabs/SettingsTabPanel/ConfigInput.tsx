import {
    FormControl,
    FormHelperText,
    FormLabel,
    Input,
    Textarea,
} from "@mui/joy";

import {Nullable} from "../../../../../typings/common";
import {
    CONFIG_KEY,
    ProfileName,
} from "../../../../../typings/config";


interface ConfigInputProps {
    profileName: Nullable<ProfileName>;
    helperText: React.ReactElement;
    initialValue: string;
    name: CONFIG_KEY;
    label: string;
    type: string;
}

/**
 * Renders a button for toggling .
 *
 * @param root0
 * @param root0.profileName
 * @param root0.helperText
 * @param root0.initialValue
 * @param root0.name
 * @param root0.label
 * @param root0.type
 * @return
 */
const ConfigInput = ({
    profileName,
    helperText,
    initialValue,
    name,
    label,
    type,
}: ConfigInputProps) => {
    return (
        <FormControl
            key={`${null === profileName ?
                "" :
                profileName}/${name}`}
        >
            <FormLabel>
                {label}
            </FormLabel>
            {"number" === type ?
                (
                    <Input
                        defaultValue={initialValue}
                        name={name}
                        type={"number"}/>
                ) :
                (
                    <Textarea
                        defaultValue={initialValue}
                        name={name}/>
                )}
            <FormHelperText>
                {helperText}
            </FormHelperText>
        </FormControl>
    );
};
export type {ConfigInputProps};
export default ConfigInput;
