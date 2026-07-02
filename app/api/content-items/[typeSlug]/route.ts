import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import crypto from "crypto"

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ typeSlug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const publishedOnly = searchParams.get("published") === "true"

        const contentTypeResult = await pool.query(
            `SELECT * FROM "ContentType" WHERE "slug" = $1 LIMIT 1`,
            [params.typeSlug]
        )
        const contentType = contentTypeResult.rows[0]

        if (!contentType) {
            return NextResponse.json({ error: "Content type not found" }, { status: 404 })
        }

        const queryParams: any[] = [contentType.id]
        let sql = `SELECT * FROM "ContentItem" WHERE "contentTypeId" = $1`
        if (publishedOnly) {
            queryParams.push(true)
            sql += ` AND "published" = $2`
        }
        sql += ` ORDER BY "createdAt" DESC`

        const { rows: items } = await pool.query(sql, queryParams)

        // Parse JSON data for response
        const parsedItems = items.map(item => ({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
        }))

        return NextResponse.json(parsedItems)
    } catch (error) {
        console.error("Error fetching content items:", error)
        return NextResponse.json({ error: "Failed to fetch content items" }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ typeSlug: string }> }
) {
    const params = await props.params;
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const contentTypeResult = await pool.query(
            `SELECT * FROM "ContentType" WHERE "slug" = $1 LIMIT 1`,
            [params.typeSlug]
        )
        const contentType = contentTypeResult.rows[0]

        if (!contentType) {
            return NextResponse.json({ error: "Content type not found" }, { status: 404 })
        }

        const body = await request.json()
        const { data, published } = body

        // TODO: Add strict validation against fields here if needed
        const now = new Date()
        const { rows } = await pool.query(
            `INSERT INTO "ContentItem" ("id", "contentTypeId", "data", "published", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $5)
             RETURNING *`,
            [crypto.randomUUID(), contentType.id, JSON.stringify(data || {}), published ?? false, now]
        )
        const item = rows[0]

        return NextResponse.json({
            ...item,
            data: typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
        })
    } catch (error) {
        console.error("Error creating content item:", error)
        return NextResponse.json({ error: "Failed to create content item" }, { status: 500 })
    }
}