import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rows } = await pool.query(
      `SELECT b.*,
        CASE
          WHEN u."id" IS NULL THEN NULL
          ELSE json_build_object('name', u."name", 'email', u."email")
        END AS author
       FROM "Blog" b
       LEFT JOIN "User" u ON u."id" = b."authorId"
       WHERE b."id" = $1
       LIMIT 1`,
      [params.id]
    )
    const blog = rows[0]

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 })
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error("Error fetching blog:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
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
      publishedAt,
    } = body

    // Check if slug already exists for another blog
    const existingResult = await pool.query(
      `SELECT "id" FROM "Blog" WHERE "slug" = $1 LIMIT 1`,
      [slug]
    )
    const existingBlog = existingResult.rows[0]

    if (existingBlog && existingBlog.id !== params.id) {
      return NextResponse.json(
        { error: "A blog with this slug already exists" },
        { status: 400 }
      )
    }

    const isPublished = Boolean(published)
    const { rows } = await pool.query(
      `UPDATE "Blog"
       SET "title" = $1,
           "slug" = $2,
           "content" = $3,
           "excerpt" = $4,
           "published" = $5,
           "featured" = $6,
           "tags" = $7,
           "image" = $8,
           "category" = $9,
           "subcategory" = $10,
           "status" = $11,
           "publishedAt" = $12,
           "updatedAt" = $13
       WHERE "id" = $14
       RETURNING *`,
      [
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
        publishedAt ? new Date(publishedAt) : null,
        new Date(),
        params.id,
      ]
    )
    const blog = rows[0]

    if (!blog) {
      throw new Error("Blog record not found")
    }

    return NextResponse.json(blog)
  } catch (error) {
    console.error("Error updating blog:", error)
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    )
  }
}
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await pool.query(
      `DELETE FROM "Blog" WHERE "id" = $1 RETURNING "id"`,
      [params.id]
    )

    if (!result.rows[0]) {
      throw new Error("Blog record not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting blog:", error)
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    )
  }
}