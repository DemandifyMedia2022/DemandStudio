import { z } from 'zod';
import { pool } from '@/lib/db';
import { RESERVED_FIELDS } from './constants';

export class SchemaRegistry {
    /**
     * Generates a Zod schema for a given Content Type slug.
     * This fetches the definition from the DB (ContentType + ContentFields)
     * and builds a dynamic Zod validator.
     */
    static async getValidationSchema(typeSlug: string, projectId?: string) {
        const params: any[] = [typeSlug];
        let sql = `SELECT * FROM "ContentType" WHERE "slug" = $1`;
        if (projectId) {
            params.push(projectId);
            sql += ` AND "projectId" = $2`;
        }
        sql += ` LIMIT 1`;

        const contentTypeResult = await pool.query(sql, params);
        const contentType = contentTypeResult.rows[0];

        if (!contentType) {
            throw new Error(`Content type '${typeSlug}' not found.`);
        }

        const fieldsResult = await pool.query(
            `SELECT * FROM "ContentField" WHERE "contentTypeId" = $1 ORDER BY "order" ASC`,
            [contentType.id]
        );
        const fields = fieldsResult.rows;

        const shape: Record<string, z.ZodTypeAny> = {};

        fields.forEach((field: any) => {
            if (RESERVED_FIELDS.includes(field.key as any)) {
                return;
            }

            let fieldSchema: z.ZodTypeAny;

            switch (field.type) {
                case 'text':
                case 'string':
                case 'rich-text':
                case 'url':
                case 'slug':
                    fieldSchema = z.string();
                    break;
                case 'number':
                    fieldSchema = z.number();
                    break;
                case 'boolean':
                    fieldSchema = z.boolean();
                    break;
                case 'date':
                case 'datetime':
                    fieldSchema = z.string().datetime().or(z.date());
                    break;
                case 'json':
                    fieldSchema = z.any();
                    break;
                default:
                    fieldSchema = z.any();
            }

            if (!field.required) {
                fieldSchema = fieldSchema.optional().nullable();
            }

            shape[field.key] = fieldSchema;
        });

        return z.object(shape).passthrough();
    }
}