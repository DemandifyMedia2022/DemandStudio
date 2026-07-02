import { pool } from '@/lib/db';
import { CMS_FIELDS } from './constants';
import { CmsQueryOptions, CmsDocument } from './types';

function mapVirtualDocument(row: any, type: 'post' | 'blog'): CmsDocument {
    return {
        ...row,
        [CMS_FIELDS.ID]: row.id,
        [CMS_FIELDS.TYPE]: type,
        [CMS_FIELDS.CREATED_AT]: row.createdAt.toISOString(),
        [CMS_FIELDS.UPDATED_AT]: row.updatedAt.toISOString(),
        [CMS_FIELDS.REV]: row.updatedAt.getTime().toString(),
        [CMS_FIELDS.PROJECT_ID]: row.projectId || undefined,
    };
}

function mapContentItem(row: any): CmsDocument {
    let data: any = {};
    try {
        data = JSON.parse(row.data);
    } catch (e) {
        data = {};
    }

    return {
        ...data,
        [CMS_FIELDS.ID]: row.id,
        [CMS_FIELDS.TYPE]: row.contentType.slug,
        [CMS_FIELDS.CREATED_AT]: row.createdAt.toISOString(),
        [CMS_FIELDS.UPDATED_AT]: row.updatedAt.toISOString(),
        [CMS_FIELDS.REV]: row.updatedAt.getTime().toString(),
        [CMS_FIELDS.PROJECT_ID]: row.contentType.projectId || undefined,
    };
}

export class CmsQueryEngine {
    /**
     * unified query method to get "Documents" (ContentItems)
     * formatted as Sanity-like JSON objects.
     */
    static async query(options: CmsQueryOptions): Promise<CmsDocument[]> {
        const { type, limit = 10, offset = 0, projectId, filter } = options;

        if (type === 'post') {
            const params: any[] = [];
            const clauses: string[] = [];
            if (projectId) {
                params.push(projectId);
                clauses.push(`p."projectId" = $${params.length}`);
            }
            if (filter?.published !== undefined) {
                params.push(filter.published);
                clauses.push(`p."published" = $${params.length}`);
            }
            const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
            const { rows } = await pool.query(
                `SELECT p.* FROM "Post" p ${whereSql} ORDER BY p."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, limit, offset]
            );
            return rows.map(row => mapVirtualDocument(row, 'post'));
        }

        if (type === 'blog') {
            const params: any[] = [];
            const clauses: string[] = [];
            if (projectId) {
                params.push(projectId);
                clauses.push(`b."projectId" = $${params.length}`);
            }
            if (filter?.published !== undefined) {
                params.push(filter.published);
                clauses.push(`b."published" = $${params.length}`);
            }
            const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
            const { rows } = await pool.query(
                `SELECT b.* FROM "Blog" b ${whereSql} ORDER BY b."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
                [...params, limit, offset]
            );
            return rows.map(row => mapVirtualDocument(row, 'blog'));
        }

        let contentTypeId: string | undefined;

        if (type) {
            const params: any[] = [type];
            let sql = `SELECT * FROM "ContentType" WHERE "slug" = $1`;
            if (projectId) {
                params.push(projectId);
                sql += ` AND "projectId" = $2`;
            }
            sql += ` LIMIT 1`;
            const { rows } = await pool.query(sql, params);
            const ct = rows[0];
            if (ct) {
                contentTypeId = ct.id;
            } else {
                return [];
            }
        }

        const params: any[] = [];
        const clauses: string[] = [];

        if (contentTypeId) {
            params.push(contentTypeId);
            clauses.push(`ci."contentTypeId" = $${params.length}`);
        }

        if (filter?.published !== undefined) {
            params.push(filter.published);
            clauses.push(`ci."published" = $${params.length}`);
        }

        const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
        const { rows } = await pool.query(
            `SELECT ci.*, row_to_json(ct.*) AS "contentType"
             FROM "ContentItem" ci
             INNER JOIN "ContentType" ct ON ct."id" = ci."contentTypeId"
             ${whereSql}
             ORDER BY ci."createdAt" DESC
             LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, limit, offset]
        );

        return rows.map(mapContentItem);
    }

    static async getById(id: string): Promise<CmsDocument | null> {
        const itemResult = await pool.query(
            `SELECT ci.*, row_to_json(ct.*) AS "contentType"
             FROM "ContentItem" ci
             INNER JOIN "ContentType" ct ON ct."id" = ci."contentTypeId"
             WHERE ci."id" = $1
             LIMIT 1`,
            [id]
        );
        const item = itemResult.rows[0];

        if (item) {
            return mapContentItem(item);
        }

        const postResult = await pool.query(`SELECT * FROM "Post" WHERE "id" = $1 LIMIT 1`, [id]);
        const post = postResult.rows[0];
        if (post) {
            return mapVirtualDocument(post, 'post');
        }

        const blogResult = await pool.query(`SELECT * FROM "Blog" WHERE "id" = $1 LIMIT 1`, [id]);
        const blog = blogResult.rows[0];
        if (blog) {
            return mapVirtualDocument(blog, 'blog');
        }

        return null;
    }
}