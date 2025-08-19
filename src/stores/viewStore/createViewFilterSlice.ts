import {StateCreator} from "zustand";

import {LogLevelFilter} from "../../typings/logs";
import {UI_STATE} from "../../typings/states";
import {CURSOR_CODE} from "../../typings/worker";
import useLogFileManagerStore from "../logFileManagerProxyStore";
import {handleErrorWithNotification} from "../notificationStore";
import useQueryStore from "../queryStore";
import useUiStore from "../uiStore";
import {
    ViewFilterSlice,
    ViewFilterValues,
    ViewState,
} from "./types";


const VIEW_FILTER_DEFAULT: ViewFilterValues = {
    logLevelFilter: null,
    kqlFilter: "",
};

/**
 * Creates a slice for view utility functions.
 *
 * @param set
 * @param get
 * @return
 */
const createViewFilterSlice: StateCreator<
    ViewState, [], [], ViewFilterSlice
> = (set, get) => ({
    ...VIEW_FILTER_DEFAULT,
    filterLogs: () => {
        const {logLevelFilter, kqlFilter} = get();
        console.error(kqlFilter);
        const {setUiState} = useUiStore.getState();
        (async () => {
            const {logFileManagerProxy} = useLogFileManagerStore.getState();
            const {logEventNum} = get();
            await logFileManagerProxy.setFilter(
                logLevelFilter,
                kqlFilter
            );

            const {loadPageByCursor} = get();
            await loadPageByCursor({
                code: CURSOR_CODE.EVENT_NUM,
                args: {
                    eventNum: logEventNum,
                },
            });
            setUiState(UI_STATE.READY);

            const {startQuery} = useQueryStore.getState();
            startQuery();
        })().catch(handleErrorWithNotification);
    },
    setLogLevelFilter: (newValue) => {
        set({logLevelFilter: newValue});
    },
    setKqlFilter: (newValue) => {
        set({kqlFilter: newValue});
    },
});

export default createViewFilterSlice;
