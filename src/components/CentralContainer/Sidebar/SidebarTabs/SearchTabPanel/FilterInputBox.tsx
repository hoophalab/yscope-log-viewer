import React, {useCallback} from "react";

import {
    Button,
    LinearProgress,
    Stack,
    Textarea,
} from "@mui/joy";

import useQueryStore from "../../../../../stores/queryStore";
import useUiStore from "../../../../../stores/uiStore";
import useViewStore from "../../../../../stores/viewStore";
import {QUERY_PROGRESS_VALUE_MAX} from "../../../../../typings/query";
import {UI_ELEMENT} from "../../../../../typings/states";
import {isDisabled} from "../../../../../utils/states";
import {updateWindowUrlHashParams} from "../../../../../utils/url";
import ToggleIconButton from "./ToggleIconButton";

import "./QueryInputBox.css";


/**
 * Provides a text input and optional toggles for submitting search queries.
 *
 * @return
 */
const FilterInputBox = () => {
    const queryString = useViewStore((state) => state.kqlFilter);
    const uiState = useUiStore((state) => state.uiState);

    const handleQueryInputChange = useCallback((ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newQueryString = ev.target.value;
        const {setKqlFilter: updateKqlFilter} = useViewStore.getState();
        updateKqlFilter(newQueryString);
    }, []);

    const handleButtonClick = useCallback(() => {
        const {filterLogs} = useViewStore.getState();
        filterLogs();
    }, []);

    const isFilterInputBoxDisabled = isDisabled(uiState, UI_ELEMENT.QUERY_INPUT_BOX);

    return (
        <div className={"query-input-box-with-progress"}>
            <Textarea
                className={"query-input-box"}
                maxRows={7}
                placeholder={"KQL filter"}
                size={"sm"}
                value={queryString}
                slotProps={{
                    textarea: {
                        className: "query-input-box-textarea",
                        disabled: isFilterInputBoxDisabled,
                    },
                    endDecorator: {className: "query-input-box-end-decorator"},
                }}
                onChange={handleQueryInputChange}/>
            <Button onClick={handleButtonClick}> filter </Button>
        </div>
    );
};


export default FilterInputBox;
