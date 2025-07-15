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
 * @param props
 * @param props.profileName
 * @param props.helperText
 * @param props.initialValue
 * @param props.name
 * @param props.label
 * @param props.type
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
