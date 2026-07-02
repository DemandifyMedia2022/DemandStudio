import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ typeSlug: string; id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { rows } = await pool.query(
            `SELECT ci.*, row_to_json(ct.*) AS "contentType"
             FROM "ContentItem" ci
             INNER JOIN "ContentType" ct ON ct."id" = ci."contentTypeId"
             WHERE ci."id" = $1
             LIMIT 1`,
            [params.id]
        )
        const item = rows[0]

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 })
        }

        if (item.contentType.slug !== params.typeSlug) {
            return NextResponse.json({ error: "Item type mismatch" }, { status: 400 })
        }

        return NextResponse.json({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
        })
    } catch (error) {
        console.error("Error fetching content item:", error)
        return NextResponse.json({ error: "Failed to fetch content item" }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    props: { params: Promise<{ typeSlug: string; id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { data, published } = body

        const { rows } = await pool.query(
            `UPDATE "ContentItem"
             SET "data" = $1, "published" = $2, "updatedAt" = $3
             WHERE "id" = $4
             RETURNING *`,
            [JSON.stringify(data), published, new Date(), params.id]
        )
        const item = rows[0]

        return NextResponse.json({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
        })
    } catch (error) {
        console.error("Error updating content item:", error)
        return NextResponse.json({ error: "Failed to update content item" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ typeSlug: string; id: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await pool.query(`DELETE FROM "ContentItem" WHERE "id" = $1`, [params.id])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting content item:", error)
        return NextResponse.json({ error: "Failed to delete content item" }, { status: 500 })
    }
}