import React from "react";

import {Link} from "@mui/joy";

import {CONFIG_KEY} from "../../../../../typings/config";


interface ConfigDescription {
    helperText: React.ReactElement;
    label: string;
    name: CONFIG_KEY;
    type: string;
}

const GLOBAL_CONFIG_DESCRIPTIONS: ConfigDescription[] = [
    {
        helperText: <span>Number of log messages to display per page.</span>,
        label: "View: Page size",
        name: CONFIG_KEY.PAGE_SIZE,
        type: "number",
    },
];

const PROFILE_MANAGED_CONFIG_DESCRIPTIONS: ConfigDescription[] = [
    {
        helperText: (
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
        name: CONFIG_KEY.DECODER_FORMAT_STRING,
        type: "text",
    },
    {
        helperText: (
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
        name: CONFIG_KEY.DECODER_LOG_LEVEL_KEY,
        type: "text",
    },
    {
        helperText: (
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
        name: CONFIG_KEY.DECODER_TIMESTAMP_KEY,
        type: "text",
    },
    {
        helperText: <span>[Unstructured-IR] Format string for timestamps in Day.js format.</span>,
        label: "Decoder: Timestamp format string",
        name: CONFIG_KEY.DECODER_TIMESTAMP_FORMAT_STRING,
        type: "text",
    },
];

export {
    GLOBAL_CONFIG_DESCRIPTIONS,
    PROFILE_MANAGED_CONFIG_DESCRIPTIONS,
};
