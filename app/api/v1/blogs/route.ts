import { NextRequest } from 'next/server'
import { pool } from '@/lib/db'
import { corsMiddleware } from '@/lib/cors'
import { apiSuccessResponse, apiErrorResponse } from '@/lib/api-auth'

export async function OPTIONS(request: NextRequest) {
  return corsMiddleware(request) || new Response(null, { status: 200 })
}

function buildBlogWhere(searchParams: URLSearchParams) {
  const params: any[] = []
  const clauses: string[] = []
  const published = searchParams.get('published')
  const featured = searchParams.get('featured')
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const tags = searchParams.get('tags')

  params.push(published !== null ? published === 'true' : true)
  clauses.push(`b."published" = $${params.length}`)

  if (featured === 'true') {
    params.push(true)
    clauses.push(`b."featured" = $${params.length}`)
  }

  if (category) {
    params.push(category)
    clauses.push(`b."category" = $${params.length}`)
  }

  const orParts: string[] = []
  if (search) {
    params.push(`%${search}%`)
    const idx = params.length
    orParts.push(`b."title" ILIKE $${idx}`, `b."content" ILIKE $${idx}`, `b."excerpt" ILIKE $${idx}`)
  }

  if (tags) {
    for (const tag of tags.split(',').map(tag => tag.trim()).filter(Boolean)) {
      params.push(`%${tag}%`)
      orParts.push(`b."tags" ILIKE $${params.length}`)
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
    const { whereSql, params } = buildBlogWhere(searchParams)

    const blogsResult = await pool.query(
      `SELECT b.*,
        CASE WHEN u."id" IS NULL THEN NULL ELSE json_build_object('id', u."id", 'name', u."name", 'email', u."email") END AS author
       FROM "Blog" b
       LEFT JOIN "User" u ON u."id" = b."authorId"
       WHERE ${whereSql}
       ORDER BY b."publishedAt" DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Blog" b WHERE ${whereSql}`,
      params
    )
    const total = totalResult.rows[0]?.count ?? 0

    return apiSuccessResponse(
      {
        data: blogsResult.rows,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      200,
      request
    )
  } catch (error) {
    console.error('Error fetching blogs:', error)
    return apiErrorResponse('Failed to fetch blogs', 500, request)
  }
}