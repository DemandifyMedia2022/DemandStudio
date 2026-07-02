import { NextRequest } from 'next/server'
import { pool } from '@/lib/db'
import { corsMiddleware } from '@/lib/cors'
import { apiSuccessResponse, apiErrorResponse } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return corsMiddleware(request) || new Response(null, { status: 200 })
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const { rows } = await pool.query(
      `SELECT b.*,
        CASE WHEN u."id" IS NULL THEN NULL ELSE json_build_object('id', u."id", 'name', u."name", 'email', u."email") END AS author
       FROM "Blog" b
       LEFT JOIN "User" u ON u."id" = b."authorId"
       WHERE b."slug" = $1
       LIMIT 1`,
      [params.slug]
    )
    const blog = rows[0]

    if (!blog) {
      return apiErrorResponse('Blog not found', 404, request)
    }

    if (!blog.published) {
      return apiErrorResponse('Blog not found', 404, request)
    }

    return apiSuccessResponse({ data: blog }, 200, request)
  } catch (error) {
    console.error('Error fetching blog:', error)
    return apiErrorResponse('Failed to fetch blog', 500, request)
  }
}