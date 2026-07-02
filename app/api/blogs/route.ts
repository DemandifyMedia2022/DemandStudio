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
    const {
      title,
      slug,
      content,
      excerpt,
      published,
      featured,
      tags,
      image,
      category,
      subcategory,
      status,
      authorId,
      publishedAt,
    } = body

    const existingResult = await pool.query(
      `SELECT "id" FROM "Blog" WHERE "slug" = $1 LIMIT 1`,
      [slug]
    )

    if (existingResult.rows[0]) {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 }
      )
    }

    const isPublished = Boolean(published)
    const now = new Date()
    const { rows } = await pool.query(
      `INSERT INTO "Blog" (
        "id", "title", "slug", "content", "excerpt", "published", "featured", "tags", "image", "category",
        "subcategory", "status", "authorId", "publishedAt", "organizationId", "projectId", "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17)
       RETURNING *`,
      [
        crypto.randomUUID(),
        title,
        slug,
        content,
        excerpt || null,
        isPublished,
        Boolean(featured),
        tags || null,
        image || null,
        category || null,
        subcategory || null,
        status || (isPublished ? "published" : "draft"),
        authorId || session.user.id,
        publishedAt ? new Date(publishedAt) : null,
        body.organizationId || null,
        body.projectId || null,
        now,
      ]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error("Error creating blog:", error)
    return NextResponse.json(
      { error: "Failed to create blog" },
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

    const { rows: blogs } = await pool.query(
      `SELECT b.*,
        CASE
          WHEN u."id" IS NULL THEN NULL
          ELSE json_build_object('name', u."name", 'email', u."email")
        END AS author
       FROM "Blog" b
       LEFT JOIN "User" u ON u."id" = b."authorId"
       ORDER BY b."createdAt" DESC`
    )

    return NextResponse.json(blogs)
  } catch (error) {
    console.error("Error fetching blogs:", error)
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    )
  }
}