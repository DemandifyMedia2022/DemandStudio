import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { corsHeaders, corsMiddleware } from "@/lib/cors"
import crypto from "crypto"

export async function OPTIONS(request: NextRequest) {
  return corsMiddleware(request) || new NextResponse(null, { status: 200, headers: corsHeaders(request) })
}

export async function GET(request: NextRequest) {
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const { searchParams } = new URL(request.url)
    const blogId = searchParams.get("blogId")
    const slug = searchParams.get("slug")

    console.log(`[Public Comments API] Received fetch request - blogId: ${blogId}, slug: ${slug}`)

    if (!blogId && !slug) {
      return NextResponse.json(
        { error: "blogId or slug is required" },
        { status: 400, headers: corsHeaders(request) }
      )
    }

    let targetBlogId = blogId

    if (slug) {
      const blogResult = await pool.query(`SELECT "id" FROM "Blog" WHERE "slug" = $1 LIMIT 1`, [slug])
      const blog = blogResult.rows[0]

      if (blog) {
        targetBlogId = blog.id
        console.log(`[Public Comments API] Resolved slug "${slug}" to CMS blogId: ${targetBlogId}`)
      } else if (!targetBlogId) {
        return NextResponse.json(
          { error: "Blog not found based on provided slug" },
          { status: 404, headers: corsHeaders(request) }
        )
      }
    }

    console.log(`[Public Comments API] Querying comments for blogId:`, targetBlogId)

    const { rows: comments } = await pool.query(
      `SELECT "id", "name", "content", "parentId", "createdAt", "status"
       FROM "Comment"
       WHERE "blogId" = $1 AND "status" = $2
       ORDER BY "createdAt" DESC`,
      [targetBlogId, "approved"]
    )

    console.log(`[Public Comments API] Successfully found ${comments.length} approved comments.`)
    console.log("CMS COMMENTS RESPONSE:", comments)

    return NextResponse.json({ comments }, { headers: corsHeaders(request) })
  } catch (error) {
    console.error("Error fetching public comments:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}

export async function POST(request: NextRequest) {
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const body = await request.json()
    console.log("Incoming POST body:", body)

    const { name, email, content, blogId, slug, projectId, status, parentId } = body

    let targetBlogId = blogId

    if (!targetBlogId && slug) {
      const blogResult = await pool.query(`SELECT "id" FROM "Blog" WHERE "slug" = $1 LIMIT 1`, [slug])
      const blog = blogResult.rows[0]
      if (blog) {
        targetBlogId = blog.id
      }
    }

    if (!name || !content || !targetBlogId || !projectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders(request) }
      )
    }

    console.log("DEBUG: Preparing to save comment with parentId:", parentId)
    console.log("Saving comment:", { parentId, projectId })

    const now = new Date()
    const { rows } = await pool.query(
      `INSERT INTO "Comment" ("id", "name", "email", "content", "blogId", "projectId", "parentId", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *`,
      [crypto.randomUUID(), name, email || "", content, targetBlogId, projectId, parentId || null, status || "pending", now]
    )
    const createdComment = rows[0]

    return NextResponse.json(
      { success: true, data: { id: createdComment.id, name: createdComment.name, status: createdComment.status } },
      { status: 201, headers: corsHeaders(request) }
    )
  } catch (error) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}