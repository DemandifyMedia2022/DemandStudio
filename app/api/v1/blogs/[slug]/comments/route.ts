import { NextRequest } from 'next/server'
import { pool } from '@/lib/db'
import { corsMiddleware } from '@/lib/cors'
import { apiSuccessResponse, apiErrorResponse } from '@/lib/api-auth'
import crypto from 'crypto'

async function findPublishedBlog(slug: string) {
  const { rows } = await pool.query(
    `SELECT "id", "published" FROM "Blog" WHERE "slug" = $1 LIMIT 1`,
    [slug]
  )
  const blog = rows[0]
  return blog && blog.published ? blog : null
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const blog = await findPublishedBlog(params.slug)

    if (!blog) {
      return apiErrorResponse('Blog not found', 404, request)
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { rows: comments } = await pool.query(
      `SELECT * FROM "Comment"
       WHERE "blogId" = $1 AND "status" = $2
       ORDER BY "createdAt" DESC
       LIMIT $3 OFFSET $4`,
      [blog.id, 'approved', limit, offset]
    )

    return apiSuccessResponse({ data: comments }, 200, request)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return apiErrorResponse('Failed to fetch comments', 500, request)
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const body = await request.json()
    const { name, email, content } = body

    if (!name || !email || !content) {
      return apiErrorResponse('Missing required fields', 400, request)
    }

    const blog = await findPublishedBlog(params.slug)

    if (!blog) {
      return apiErrorResponse('Blog not found', 404, request)
    }

    const now = new Date()
    const { rows } = await pool.query(
      `INSERT INTO "Comment" ("id", "name", "email", "content", "blogId", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING *`,
      [crypto.randomUUID(), name, email, content, blog.id, 'pending', now]
    )
    const comment = rows[0]

    return apiSuccessResponse({
      data: comment,
      message: 'Comment submitted for moderation'
    }, 201, request)
  } catch (error) {
    console.error('Error submitting comment:', error)
    return apiErrorResponse('Failed to submit comment', 500, request)
  }
}