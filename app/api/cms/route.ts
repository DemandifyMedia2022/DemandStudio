import { NextRequest, NextResponse } from 'next/server';
import { CmsQueryEngine } from '@/src/modules/cms/query-engine';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const projectId = searchParams.get('projectId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!type) {
        return NextResponse.json({ 
            success: false, 
            message: "Parameter 'type' is required" 
        }, { 
            status: 400,
            headers: corsHeaders(request)
        });
    }

    try {
        // Fetch documents using the Query Engine
        const documents = await CmsQueryEngine.query({
            type,
            limit,
            offset,
            projectId,
            filter: {
                status: 'published' // Ensure only published content is returned
            }
        });

        // Map data to ensure it meets the requirements
        const formattedData = documents.map(doc => {
            return {
                id: doc._id,
                type: doc._type,
                title: doc.title || doc.name || "",
                image: doc.image || doc.thumbnail || null,
                content: doc.content || doc.body || doc.description || "",
                createdAt: doc._createdAt,
                updatedAt: doc._updatedAt,
                ...doc // Spread original doc for full transparency
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedData
        }, {
            status: 200,
            headers: corsHeaders(request)
        });

    } catch (error) {
        console.error('CMS API Error:', error);
        return NextResponse.json({
            success: false,
            message: "Internal Server Error"
        }, {
            status: 500,
            headers: corsHeaders(request)
        });
    }
}
