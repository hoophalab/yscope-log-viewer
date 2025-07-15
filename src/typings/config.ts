import {
    Static,
    Type,
} from "@sinclair/typebox";

import {TAB_NAME} from "./tab";


enum THEME_NAME {
    SYSTEM = "system",
    DARK = "dark",
    LIGHT = "light",
}

enum CONFIG_KEY {
    DECODER_FORMAT_STRING = "decoderOptions/formatString",
    DECODER_LOG_LEVEL_KEY = "decoderOptioins/logLevelKey",
    DECODER_TIMESTAMP_FORMAT_STRING = "decoderOptions/timestampFormatString",
    DECODER_TIMESTAMP_KEY = "decoderOptions/timestampKey",
    INITIAL_TAB_NAME = "initialTabName",
    THEME = "theme",
    PAGE_SIZE = "pageSize",
}

const MAX_PAGE_SIZE = 1_000_000;

const NonEmptyStringSchema = Type.String({
    minLength: 1,
});

const ConfigMapSchema = Type.Object({
    [CONFIG_KEY.DECODER_FORMAT_STRING]: Type.String(),
    [CONFIG_KEY.DECODER_LOG_LEVEL_KEY]: NonEmptyStringSchema,
    [CONFIG_KEY.DECODER_TIMESTAMP_FORMAT_STRING]: NonEmptyStringSchema,
    [CONFIG_KEY.DECODER_TIMESTAMP_KEY]: NonEmptyStringSchema,
    [CONFIG_KEY.INITIAL_TAB_NAME]: Type.Enum(TAB_NAME),
    [CONFIG_KEY.THEME]: Type.Enum(THEME_NAME),
    [CONFIG_KEY.PAGE_SIZE]: Type.Number({minimum: 1, maximum: MAX_PAGE_SIZE}),
});

type ConfigMap = Static<typeof ConfigMapSchema>;

const ConfigUpdateSchema = Type.Partial(ConfigMapSchema);

type ConfigUpdate = Static<typeof ConfigUpdateSchema>;

const ProfileNameSchema = NonEmptyStringSchema;

type ProfileName = Static<typeof ProfileNameSchema>;

const ProfileSchema = Type.Object({
    config: ConfigUpdateSchema,
    filePathRegExps: Type.Array(Type.String()),
    lastModificationTimestampMillis: Type.Number(),
});

type Profile = Static<typeof ProfileSchema>;

const ProfileRecordSchema = Type.Record(ProfileNameSchema, ProfileSchema);

type ProfileRecord = Static<typeof ProfileRecordSchema>;

const LocalStorageSettingsSchema = Type.Object({
    activeProfileName: ProfileNameSchema,
    globalConfig: ConfigUpdateSchema,
    profileConfigs: ProfileRecordSchema,
    isForced: Type.Boolean(),
});

type LocalStorageSettings = Static<typeof LocalStorageSettingsSchema>;

const EXPORT_LOGS_CHUNK_SIZE = 10_000;
const QUERY_CHUNK_SIZE = 10_000;

export {
    CONFIG_KEY,
    ConfigMapSchema,
    ConfigUpdateSchema,
    EXPORT_LOGS_CHUNK_SIZE,
    LocalStorageSettingsSchema,
    ProfileNameSchema,
    ProfileRecordSchema,
    ProfileSchema,
    QUERY_CHUNK_SIZE,
    THEME_NAME,
};
export type {
    ConfigMap,
    ConfigUpdate,
    LocalStorageSettings,
    Profile,
    ProfileName,
    ProfileRecord,
};
