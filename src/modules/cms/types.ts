import { CMS_FIELDS } from './constants';

export interface CmsDocument {
    [CMS_FIELDS.ID]: string;
    [CMS_FIELDS.TYPE]: string;
    [CMS_FIELDS.CREATED_AT]: string;
    [CMS_FIELDS.UPDATED_AT]: string;
    [CMS_FIELDS.REV]: string;
    [CMS_FIELDS.PROJECT_ID]?: string;
    [key: string]: any;
}

export interface CmsQueryOptions {
    type?: string;
    limit?: number;
    offset?: number;
    projectId?: string;
    filter?: Record<string, any>; // Simple filter object for now
}

export type SanityLikeDocument = CmsDocument;
