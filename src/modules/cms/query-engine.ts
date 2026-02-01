import { prisma } from '@/lib/prisma';
import { CMS_FIELDS } from './constants';
import { CmsQueryOptions, CmsDocument } from './types';

export class CmsQueryEngine {
    /**
     * unified query method to get "Documents" (ContentItems) 
     * formatted as Sanity-like JSON objects.
     */
    static async query(options: CmsQueryOptions): Promise<CmsDocument[]> {
        const { type, limit = 10, offset = 0, projectId, filter } = options;

        // 1. Resolve ContentType ID if 'type' (slug) is provided
        let contentTypeId: string | undefined;

        // 0. Handle Virtual Types (Post, Blog)
        if (type === 'post') {
            const where: any = {};
            if (projectId) where.projectId = projectId;
            if (filter?.published !== undefined) where.published = filter.published;

            const posts = await prisma.post.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' }
            });

            return posts.map(post => ({
                ...post,
                [CMS_FIELDS.ID]: post.id,
                [CMS_FIELDS.TYPE]: 'post',
                [CMS_FIELDS.CREATED_AT]: post.createdAt.toISOString(),
                [CMS_FIELDS.UPDATED_AT]: post.updatedAt.toISOString(),
                [CMS_FIELDS.REV]: post.updatedAt.getTime().toString(),
                [CMS_FIELDS.PROJECT_ID]: post.projectId || undefined,
            }));
        }

        if (type === 'blog') {
            const where: any = {};
            if (projectId) where.projectId = projectId;
            if (filter?.published !== undefined) where.published = filter.published;

            const blogs = await prisma.blog.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' }
            });

            return blogs.map(blog => ({
                ...blog,
                [CMS_FIELDS.ID]: blog.id,
                [CMS_FIELDS.TYPE]: 'blog',
                [CMS_FIELDS.CREATED_AT]: blog.createdAt.toISOString(),
                [CMS_FIELDS.UPDATED_AT]: blog.updatedAt.toISOString(),
                [CMS_FIELDS.REV]: blog.updatedAt.getTime().toString(),
                [CMS_FIELDS.PROJECT_ID]: blog.projectId || undefined,
            }));
        }

        if (type) {
            const ct = await prisma.contentType.findFirst({
                where: {
                    slug: type,
                    projectId: projectId || undefined
                }
            });
            if (ct) {
                contentTypeId = ct.id;
            } else {
                // If type specified but not found, return empty
                return [];
            }
        }

        // 2. Build Prisma Query
        const where: any = {};

        if (contentTypeId) {
            where.contentTypeId = contentTypeId;
        }

        // Note: "Filter" implementation is limited because data is stored in 'data' LongText column (JSON string).
        // We cannot efficiently query JSON properties in MySQL unless we use JSON_EXTRACT (Native SQL).
        // For now, we fetch validation-compliant items and filter in memory or rely on basic metadata filters.

        // Allow filtering by 'published'
        if (filter?.published !== undefined) {
            where.published = filter.published;
        }

        const items = await prisma.contentItem.findMany({
            where,
            take: limit,
            skip: offset,
            include: {
                contentType: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // 3. Transform to CMS Document
        return items.map((item) => {
            let data: any = {};
            try {
                data = JSON.parse(item.data);
            } catch (e) {
                data = {};
            }

            return {
                ...data,
                [CMS_FIELDS.ID]: item.id,
                [CMS_FIELDS.TYPE]: item.contentType.slug,
                [CMS_FIELDS.CREATED_AT]: item.createdAt.toISOString(),
                [CMS_FIELDS.UPDATED_AT]: item.updatedAt.toISOString(),
                // For revision, we can use updatedAt timestamp or a hash if we implement one
                [CMS_FIELDS.REV]: item.updatedAt.getTime().toString(),
                [CMS_FIELDS.PROJECT_ID]: item.contentType.projectId || undefined,
            };
        });
    }

    static async getById(id: string): Promise<CmsDocument | null> {
        const item = await prisma.contentItem.findUnique({
            where: { id },
            include: { contentType: true }
        });

        if (item) {
            let data: any = {};
            try {
                data = JSON.parse(item.data);
            } catch (e) {
                data = {};
            }

            return {
                ...data,
                [CMS_FIELDS.ID]: item.id,
                [CMS_FIELDS.TYPE]: item.contentType.slug,
                [CMS_FIELDS.CREATED_AT]: item.createdAt.toISOString(),
                [CMS_FIELDS.UPDATED_AT]: item.updatedAt.toISOString(),
                [CMS_FIELDS.REV]: item.updatedAt.getTime().toString(),
                [CMS_FIELDS.PROJECT_ID]: item.contentType.projectId || undefined,
            };
        }

        // Try Post
        const post = await prisma.post.findUnique({ where: { id } });
        if (post) {
            return {
                ...post,
                [CMS_FIELDS.ID]: post.id,
                [CMS_FIELDS.TYPE]: 'post',
                [CMS_FIELDS.CREATED_AT]: post.createdAt.toISOString(),
                [CMS_FIELDS.UPDATED_AT]: post.updatedAt.toISOString(),
                [CMS_FIELDS.REV]: post.updatedAt.getTime().toString(),
                [CMS_FIELDS.PROJECT_ID]: post.projectId || undefined,
            };
        }

        // Try Blog
        const blog = await prisma.blog.findUnique({ where: { id } });
        if (blog) {
            return {
                ...blog,
                [CMS_FIELDS.ID]: blog.id,
                [CMS_FIELDS.TYPE]: 'blog',
                [CMS_FIELDS.CREATED_AT]: blog.createdAt.toISOString(),
                [CMS_FIELDS.UPDATED_AT]: blog.updatedAt.toISOString(),
                [CMS_FIELDS.REV]: blog.updatedAt.getTime().toString(),
                [CMS_FIELDS.PROJECT_ID]: blog.projectId || undefined,
            };
        }

        return null;
    }
}
