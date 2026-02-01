import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { RESERVED_FIELDS } from './constants';

export class SchemaRegistry {
    /**
     * Generates a Zod schema for a given Content Type slug.
     * This fetches the definition from the DB (ContentType + ContentFields)
     * and builds a dynamic Zod validator.
     */
    static async getValidationSchema(typeSlug: string, projectId?: string) {
        // 1. Fetch ContentDefinition
        const whereClause: any = { slug: typeSlug };
        if (projectId) {
            whereClause.projectId = projectId;
        }

        // Note: In a real multi-tenant scenario, we probably want to strictly enforce projectId
        // if provided, or fallback to global types if not.

        const contentType = await prisma.contentType.findFirst({
            where: whereClause,
            include: {
                fields: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!contentType) {
            throw new Error(`Content type '${typeSlug}' not found.`);
        }

        // 2. Build Zod Shape
        const shape: Record<string, z.ZodTypeAny> = {};

        contentType.fields.forEach((field) => {
            // Prevent overwriting reserved system fields
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
                    fieldSchema = z.any(); // Fallback
            }

            // Handle required vs optional
            if (!field.required) {
                fieldSchema = fieldSchema.optional().nullable();
            }

            shape[field.key] = fieldSchema;
        });

        // 3. Return generic object schema
        // We allow "passthrough" or unknown keys if we want to be flexible, 
        // but strict is better for schema enforcement. 
        // For now, we allow unknown keys to not break if extra data is present (like system fields).
        return z.object(shape).passthrough();
    }
}
