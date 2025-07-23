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
    ConfigMap,
    ConfigMapSchema,
} from "../../../../../typings/config";

import {
    Type,
    Static,
} from "@sinclair/typebox";
import {
    Value
} from "@sinclair/typebox/value";
import { useCallback, useEffect, useState } from "react";
import { getConfig } from "../../../../../utils/config";

enum CONFIG_INPUT_TYPE {
    number = "number",
    string = "string"
}

interface ConfigInputProps {
    description: React.ReactElement;
    inputName: string;
    label: string;
    inputType: string;

    updateSignal: number;
    getValue: () => string;
    onChange: (newValue: string) => Nullable<string>;
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
 * @return
 */
const ConfigInput = ({
    description,
    inputName,
    label,
    updateSignal,
    inputType,
    getValue,
    onChange,
}: ConfigInputProps) => {
    const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);
    const [value, setValue] = useState<string>(getValue());

    useEffect(() => {
        setValue(getValue());
    }, [updateSignal]);

    return (
        <FormControl>
            <FormLabel>
                {label}
            </FormLabel>
            {inputType === CONFIG_INPUT_TYPE.number ?
                (
                    <Input
                        value={value}
                        onChange={(ev) => {
                            setValue(ev.target.value);
                            setErrorMessage(onChange(ev.target.value));
                        }}
                        name={inputName}
                        type={"number"}/>
                ) :
                (
                    <Textarea
                        value={value}
                        onChange={(ev) => {
                            setValue(ev.target.value);
                            setErrorMessage(onChange(ev.target.value));
                        }}
                        name={inputName}/>
                )}
            {errorMessage === null &&
                <FormHelperText>
                    {errorMessage}
                </FormHelperText>
            }
            <FormHelperText>
                {description}
            </FormHelperText>
        </FormControl>
    );
};
export type {ConfigInputProps};
export default ConfigInput;
export {CONFIG_INPUT_TYPE as INPUT_TYPE}
