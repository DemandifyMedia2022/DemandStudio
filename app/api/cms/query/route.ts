import { NextRequest } from 'next/server';
import { validateApiKey, apiErrorResponse, apiSuccessResponse } from '@/lib/api-auth';
import { CmsQueryEngine } from '@/src/modules/cms/query-engine';

export async function GET(request: NextRequest) {
    // 1. Auth Check (API Key only for now, can extend to Session)
    const authResult = await validateApiKey(request);
    if (!authResult.valid) {
        return apiErrorResponse(authResult.error || 'Unauthorized', 401, request);
    }

    // 2. Parse Query Params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const projectId = searchParams.get('projectId') || undefined;

    // Note: If using API Key, we might want to enforce that the projectId matches the key's project 
    // (if keys are scoped to projects). `lib/api-auth` returns `userId` but could be enhanced.
    // For now, assuming Global or User-scoped keys access allowed resources.

    if (!type && !projectId) {
        // Optional: specific requirement to provide at least some filter
    }

    try {
        // 3. Execute Query
        const documents = await CmsQueryEngine.query({
            type: type || undefined,
            limit,
            offset,
            projectId,
            // Pass other filters if needed
        });

        return apiSuccessResponse({ result: documents }, 200, request);
    } catch (error) {
        console.error('CMS Query Error:', error);
        return apiErrorResponse('Internal Server Error', 500, request);
    }
}
