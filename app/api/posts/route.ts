import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, excerpt, published, featured, tags, image, authorId, publishedAt } = body

    // Check if slug already exists
    const existingResult = await pool.query(
      `SELECT "id" FROM "Post" WHERE "slug" = $1 LIMIT 1`,
      [slug]
    )

    if (existingResult.rows[0]) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      )
    }

    const now = new Date()
    const { rows } = await pool.query(
      `INSERT INTO "Post" (
        "id", "title", "slug", "content", "excerpt", "published", "featured", "tags", "image",
        "authorId", "publishedAt", "organizationId", "projectId", "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $14)
       RETURNING *`,
      [
        crypto.randomUUID(),
        title,
        slug,
        content,
        excerpt || null,
        published || false,
        featured || false,
        tags || null,
        image || null,
        authorId,
        publishedAt ? new Date(publishedAt) : null,
        body.organizationId || null,
        body.projectId || null,
        now,
      ]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rows: posts } = await pool.query(
      `SELECT p.*,
        CASE
          WHEN u."id" IS NULL THEN NULL
          ELSE json_build_object('name', u."name", 'email', u."email")
        END AS author
       FROM "Post" p
       LEFT JOIN "User" u ON u."id" = p."authorId"
       ORDER BY p."createdAt" DESC`
    )

    return NextResponse.json(posts)
  } catch (error) {
    console.error("Error fetching posts:", error)
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    )
  }
}