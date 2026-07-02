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
      `SELECT p.*,
        CASE WHEN u."id" IS NULL THEN NULL ELSE json_build_object('id', u."id", 'name', u."name", 'email', u."email") END AS author
       FROM "Post" p
       LEFT JOIN "User" u ON u."id" = p."authorId"
       WHERE p."slug" = $1
       LIMIT 1`,
      [params.slug]
    )
    const post = rows[0]

    if (!post) {
      return apiErrorResponse('Post not found', 404, request)
    }

    if (!post.published) {
      return apiErrorResponse('Post not found', 404, request)
    }

    return apiSuccessResponse({ data: post }, 200, request)
  } catch (error) {
    console.error('Error fetching post:', error)
    return apiErrorResponse('Failed to fetch post', 500, request)
  }
}