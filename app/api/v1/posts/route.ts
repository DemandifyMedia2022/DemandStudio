import { NextRequest } from 'next/server'
import { pool } from '@/lib/db'
import { corsMiddleware } from '@/lib/cors'
import { apiSuccessResponse, apiErrorResponse } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return corsMiddleware(request) || new Response(null, { status: 200 })
}

function buildPostWhere(searchParams: URLSearchParams) {
  const params: any[] = []
  const clauses: string[] = []
  const published = searchParams.get('published')
  const featured = searchParams.get('featured')
  const search = searchParams.get('search')
  const tags = searchParams.get('tags')

  params.push(published !== null ? published === 'true' : true)
  clauses.push(`p."published" = $${params.length}`)

  if (featured === 'true') {
    params.push(true)
    clauses.push(`p."featured" = $${params.length}`)
  }

  const orParts: string[] = []
  if (search) {
    params.push(`%${search}%`)
    const idx = params.length
    orParts.push(`p."title" ILIKE $${idx}`, `p."content" ILIKE $${idx}`, `p."excerpt" ILIKE $${idx}`)
  }

  if (tags) {
    for (const tag of tags.split(',').map(tag => tag.trim()).filter(Boolean)) {
      params.push(`%${tag}%`)
      orParts.push(`p."tags" ILIKE $${params.length}`)
    }
  }

  if (orParts.length) clauses.push(`(${orParts.join(' OR ')})`)
  return { whereSql: clauses.join(' AND '), params }
}

export async function GET(request: NextRequest) {
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const { whereSql, params } = buildPostWhere(searchParams)

    const postsResult = await pool.query(
      `SELECT p.*,
        CASE WHEN u."id" IS NULL THEN NULL ELSE json_build_object('id', u."id", 'name', u."name", 'email', u."email") END AS author
       FROM "Post" p
       LEFT JOIN "User" u ON u."id" = p."authorId"
       WHERE ${whereSql}
       ORDER BY p."publishedAt" DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Post" p WHERE ${whereSql}`,
      params
    )

    return apiSuccessResponse(
      {
        data: postsResult.rows,
        pagination: {
          total: totalResult.rows[0]?.count ?? 0,
          limit,
          offset,
          hasMore: offset + limit < (totalResult.rows[0]?.count ?? 0),
        },
      },
      200,
      request
    )
  } catch (error) {
    console.error('Error fetching posts:', error)
    return apiErrorResponse('Failed to fetch posts', 500, request)
  }
}