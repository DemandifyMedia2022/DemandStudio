import { NextRequest } from 'next/server';
import { validateApiKey, apiErrorResponse, apiSuccessResponse } from '@/lib/api-auth';
import { SchemaRegistry } from '@/src/modules/cms/schema-registry';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    // 1. Auth Check
    const authResult = await validateApiKey(request);
    if (!authResult.valid) {
        return apiErrorResponse(authResult.error || 'Unauthorized', 401, request);
    }

    try {
        const body = await request.json();
        const { mutations } = body;

        // Support Sanity-like mutation structure: { mutations: [ { create: { ... } }, { patch: { ... } } ] }
        // For MVP, we'll support a simpler "createOrReplace" style: { _type: 'blog', ...data }

        // MVP Implementation: Single Document Creation/Update
        const doc = body;

        if (!doc._type) {
            return apiErrorResponse('Missing _type field', 400, request);
        }

        const uniqueIdentity = doc._id;

        // Special handling for 'post' and 'blog'
        if (doc._type === 'post') {
            const postData = {
                title: doc.title,
                slug: doc.slug,
                content: doc.content || '',
                excerpt: doc.excerpt,
                published: doc.published ?? false,
                featured: doc.featured ?? false,
                image: doc.image,
                projectId: doc.projectId || undefined,
                authorId: doc.authorId || authResult.userId || 'system',
            };

            let result;
            if (uniqueIdentity) {
                result = await prisma.post.update({
                    where: { id: uniqueIdentity },
                    data: postData
                });
            } else {
                result = await prisma.post.create({
                    data: postData as any
                });
            }

            return apiSuccessResponse({
                transactionId: new Date().getTime().toString(),
                results: [{ id: result.id, operation: uniqueIdentity ? 'update' : 'create' }]
            }, 200, request);
        }

        if (doc._type === 'blog') {
            const blogData = {
                title: doc.title,
                slug: doc.slug,
                content: doc.content || '',
                excerpt: doc.excerpt,
                published: doc.published ?? false,
                featured: doc.featured ?? false,
                image: doc.image,
                projectId: doc.projectId || undefined,
                authorId: doc.authorId || authResult.userId || 'system',
            };

            let result;
            if (uniqueIdentity) {
                result = await prisma.blog.update({
                    where: { id: uniqueIdentity },
                    data: blogData
                });
            } else {
                result = await prisma.blog.create({
                    data: blogData as any
                });
            }

            return apiSuccessResponse({
                transactionId: new Date().getTime().toString(),
                results: [{ id: result.id, operation: uniqueIdentity ? 'update' : 'create' }]
            }, 200, request);
        }

        // 2. Get Validation Schema
        // In a real scenario, we'd cache this or look it up efficiently.
        const validator = await SchemaRegistry.getValidationSchema(doc._type);

        // 3. Validate
        // uniqueIdentity is already hoisted/declared at top


        // Remove system fields before validation if strict, or let SchemaRegistry handle it.
        // SchemaRegistry is currently `passthrough`, so it ignores extra fields.
        // However, we want to validate the *payload* against the defined fields.

        const parsed = validator.safeParse(doc);

        if (!parsed.success) {
            return apiErrorResponse('Validation Error', 400, request);
        }

        // 4. Persistence
        // Need to find the ContentTypeId
        const contentType = await prisma.contentType.findFirst({
            where: { slug: doc._type }
        });

        if (!contentType) {
            return apiErrorResponse(`Unknown Content Type: ${doc._type}`, 400, request);
        }

        let resultItem;
        const dataString = JSON.stringify(parsed.data);

        if (uniqueIdentity) {
            // Update or Create with specific ID
            resultItem = await prisma.contentItem.upsert({
                where: { id: uniqueIdentity },
                create: {
                    id: uniqueIdentity,
                    contentTypeId: contentType.id,
                    data: dataString,
                    published: doc.published ?? false // Default to false if not specified
                },
                update: {
                    data: dataString,
                    published: doc.published ?? undefined
                },
                include: { contentType: true }
            });
        } else {
            // Create new
            resultItem = await prisma.contentItem.create({
                data: {
                    contentTypeId: contentType.id,
                    data: dataString,
                    published: doc.published ?? false
                },
                include: { contentType: true }
            });
        }

        // 5. Response
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
