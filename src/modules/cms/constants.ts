export const CMS_FIELDS = {
    ID: '_id',
    TYPE: '_type',
    CREATED_AT: '_createdAt',
    UPDATED_AT: '_updatedAt',
    REV: '_rev',
    DATASET: '_dataset',
    PROJECT_ID: '_projectId',
} as const;

export const RESERVED_FIELDS = Object.values(CMS_FIELDS);
