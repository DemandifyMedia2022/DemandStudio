import { NextRequest } from 'next/server';
import { validateApiKey, apiErrorResponse, apiSuccessResponse } from '@/lib/api-auth';
import { SchemaRegistry } from '@/src/modules/cms/schema-registry';
import { pool } from '@/lib/db';
import crypto from 'crypto';

function postLikeData(doc: any, userId?: string) {
    return [
        doc.title,
        doc.slug,
        doc.content || '',
        doc.excerpt || null,
        doc.published ?? false,
        doc.featured ?? false,
        doc.image || null,
        doc.projectId || null,
        doc.authorId || userId || 'system',
    ];
}

async function upsertPost(doc: any, userId?: string) {
    const uniqueIdentity = doc._id;
    const data = postLikeData(doc, userId);
    if (uniqueIdentity) {
        const { rows } = await pool.query(
            `UPDATE "Post"
             SET "title" = $1, "slug" = $2, "content" = $3, "excerpt" = $4, "published" = $5,
                 "featured" = $6, "image" = $7, "projectId" = $8, "authorId" = $9, "updatedAt" = $10
             WHERE "id" = $11
             RETURNING *`,
            [...data, new Date(), uniqueIdentity]
        );
        return rows[0];
    }
    const now = new Date();
    const { rows } = await pool.query(
        `INSERT INTO "Post" ("id", "title", "slug", "content", "excerpt", "published", "featured", "image", "projectId", "authorId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
         RETURNING *`,
        [crypto.randomUUID(), ...data, now]
    );
    return rows[0];
}

async function upsertBlog(doc: any, userId?: string) {
    const uniqueIdentity = doc._id;
    const data = postLikeData(doc, userId);
    if (uniqueIdentity) {
        const { rows } = await pool.query(
            `UPDATE "Blog"
             SET "title" = $1, "slug" = $2, "content" = $3, "excerpt" = $4, "published" = $5,
                 "featured" = $6, "image" = $7, "projectId" = $8, "authorId" = $9, "updatedAt" = $10
             WHERE "id" = $11
             RETURNING *`,
            [...data, new Date(), uniqueIdentity]
        );
        return rows[0];
    }
    const now = new Date();
    const { rows } = await pool.query(
        `INSERT INTO "Blog" ("id", "title", "slug", "content", "excerpt", "published", "featured", "image", "projectId", "authorId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
         RETURNING *`,
        [crypto.randomUUID(), ...data, now]
    );
    return rows[0];
}

export async function POST(request: NextRequest) {
    const authResult = await validateApiKey(request);
    if (!authResult.valid) {
        return apiErrorResponse(authResult.error || 'Unauthorized', 401, request);
    }

    try {
        const body = await request.json();
        const doc = body;

        if (!doc._type) {
            return apiErrorResponse('Missing _type field', 400, request);
        }

        const uniqueIdentity = doc._id;

        if (doc._type === 'post') {
            const result = await upsertPost(doc, authResult.userId);
            return apiSuccessResponse({
                transactionId: new Date().getTime().toString(),
                results: [{ id: result.id, operation: uniqueIdentity ? 'update' : 'create' }]
            }, 200, request);
        }

        if (doc._type === 'blog') {
            const result = await upsertBlog(doc, authResult.userId);
            return apiSuccessResponse({
                transactionId: new Date().getTime().toString(),
                results: [{ id: result.id, operation: uniqueIdentity ? 'update' : 'create' }]
            }, 200, request);
        }

        const validator = await SchemaRegistry.getValidationSchema(doc._type);
        const parsed = validator.safeParse(doc);

        if (!parsed.success) {
            return apiErrorResponse('Validation Error', 400, request);
        }

        const contentTypeResult = await pool.query(
            `SELECT * FROM "ContentType" WHERE "slug" = $1 LIMIT 1`,
            [doc._type]
        );
        const contentType = contentTypeResult.rows[0];

        if (!contentType) {
            return apiErrorResponse(`Unknown Content Type: ${doc._type}`, 400, request);
        }

        let resultItem;
        const dataString = JSON.stringify(parsed.data);
        const now = new Date();

        if (uniqueIdentity) {
            const existingResult = await pool.query(`SELECT "id" FROM "ContentItem" WHERE "id" = $1 LIMIT 1`, [uniqueIdentity]);
            if (existingResult.rows[0]) {
                const updateResult = await pool.query(
                    `UPDATE "ContentItem"
                     SET "data" = $1, "published" = COALESCE($2, "published"), "updatedAt" = $3
                     WHERE "id" = $4
                     RETURNING *`,
                    [dataString, doc.published === undefined ? null : doc.published, now, uniqueIdentity]
                );
                resultItem = updateResult.rows[0];
            } else {
                const createResult = await pool.query(
                    `INSERT INTO "ContentItem" ("id", "contentTypeId", "data", "published", "createdAt", "updatedAt")
                     VALUES ($1, $2, $3, $4, $5, $5)
                     RETURNING *`,
                    [uniqueIdentity, contentType.id, dataString, doc.published ?? false, now]
                );
                resultItem = createResult.rows[0];
            }
        } else {
            const createResult = await pool.query(
                `INSERT INTO "ContentItem" ("id", "contentTypeId", "data", "published", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $5)
                 RETURNING *`,
                [crypto.randomUUID(), contentType.id, dataString, doc.published ?? false, now]
            );
            resultItem = createResult.rows[0];
        }

        return apiSuccessResponse({
            transactionId: new Date().getTime().toString(),
            results: [
                {
                    id: resultItem.id,
                    operation: uniqueIdentity ? 'update' : 'create'
                }
            ]
        }, 200, request);

    } catch (error) {
        console.error('CMS Mutation Error:', error);
        return apiErrorResponse('Internal Server Error', 500, request);
    }
}