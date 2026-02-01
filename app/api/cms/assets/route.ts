import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, apiErrorResponse, apiSuccessResponse } from '@/lib/api-auth';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { CMS_FIELDS } from '@/src/modules/cms/constants';

export async function POST(request: NextRequest) {
    // 1. Auth
    const authResult = await validateApiKey(request);
    if (!authResult.valid) {
        return apiErrorResponse(authResult.error || 'Unauthorized', 401, request);
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return apiErrorResponse('No file uploaded', 400, request);
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Reuse naming strategy
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');

        const uploadDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        const path = join(uploadDir, filename);
        await writeFile(path, buffer);

        const url = `/uploads/${filename}`;

        // Return as CMS Document structure for "sanity.imageAsset"
        const assetDoc = {
            [CMS_FIELDS.ID]: `image-${uniqueSuffix}`,
            [CMS_FIELDS.TYPE]: 'sanity.imageAsset',
            [CMS_FIELDS.CREATED_AT]: new Date().toISOString(),
            [CMS_FIELDS.UPDATED_AT]: new Date().toISOString(),
            [CMS_FIELDS.REV]: uniqueSuffix,
            url,
            originalFilename: file.name,
            size: file.size,
            mimeType: file.type,
            extension: filename.split('.').pop()
        };

        return apiSuccessResponse(assetDoc, 200, request);

    } catch (error) {
        console.error('CMS Asset Upload Error:', error);
        return apiErrorResponse('Internal Server Error', 500, request);
    }
}

// OPTIONS method handled by middleware if using it, or we can explicitly add it if needed.
// existing cors.ts has check for OPTIONS in middleware.
