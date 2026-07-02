import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rows } = await pool.query(
      `SELECT p.*,
        CASE
          WHEN u."id" IS NULL THEN NULL
          ELSE json_build_object('name', u."name", 'email', u."email")
        END AS author
       FROM "Post" p
       LEFT JOIN "User" u ON u."id" = p."authorId"
       WHERE p."id" = $1
       LIMIT 1`,
      [params.id]
    )
    const post = rows[0]

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error fetching post:", error)
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, slug, content, excerpt, published, featured, tags, image, publishedAt } = body

    // Check if slug already exists for another post
    const existingResult = await pool.query(
      `SELECT "id" FROM "Post" WHERE "slug" = $1 LIMIT 1`,
      [slug]
    )
    const existingPost = existingResult.rows[0]

    if (existingPost && existingPost.id !== params.id) {
      return NextResponse.json(
        { error: "A post with this slug already exists" },
        { status: 400 }
      )
    }

    const { rows } = await pool.query(
      `UPDATE "Post"
       SET "title" = $1,
           "slug" = $2,
           "content" = $3,
           "excerpt" = $4,
           "published" = $5,
           "featured" = $6,
           "tags" = $7,
           "image" = $8,
           "publishedAt" = $9,
           "updatedAt" = $10
       WHERE "id" = $11
       RETURNING *`,
      [
        title,
        slug,
        content,
        excerpt || null,
        published || false,
        featured || false,
        tags || null,
        image || null,
        publishedAt ? new Date(publishedAt) : null,
        new Date(),
        params.id,
      ]
    )
    const post = rows[0]

    if (!post) {
      throw new Error("Post record not found")
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error updating post:", error)
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await pool.query(
      `DELETE FROM "Post" WHERE "id" = $1 RETURNING "id"`,
      [params.id]
    )

    if (!result.rows[0]) {
      throw new Error("Post record not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting post:", error)
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    )
  }
}