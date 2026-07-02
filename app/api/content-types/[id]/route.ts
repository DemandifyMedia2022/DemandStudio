import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import crypto from "crypto"

async function getContentType(id: string) {
    const { rows } = await pool.query(`SELECT * FROM "ContentType" WHERE "id" = $1 LIMIT 1`, [id])
    const contentType = rows[0]
    if (!contentType) return null
    const fieldsResult = await pool.query(
        `SELECT * FROM "ContentField" WHERE "contentTypeId" = $1 ORDER BY "order" ASC`,
        [id]
    )
    return { ...contentType, fields: fieldsResult.rows }
}

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

        const contentType = await getContentType(params.id)

        if (!contentType) {
            return NextResponse.json({ error: "Content type not found" }, { status: 404 })
        }

        return NextResponse.json(contentType)
    } catch (error) {
        console.error("Error fetching content type:", error)
        return NextResponse.json({ error: "Failed to fetch content type" }, { status: 500 })
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
        const { name, description, fields } = body
        const client = await pool.connect()

        try {
            await client.query("BEGIN")
            await client.query(
                `UPDATE "ContentType" SET "name" = $1, "description" = $2, "updatedAt" = $3 WHERE "id" = $4`,
                [name, description || null, new Date(), params.id]
            )

            if (fields && Array.isArray(fields)) {
                for (const [index, field] of fields.entries()) {
                    const fieldData = [
                        field.name,
                        field.key,
                        field.type,
                        field.required ?? false,
                        field.options ? JSON.stringify(field.options) : null,
                        index,
                        params.id,
                    ]

                    if (field.id && !field.id.startsWith("temp-")) {
                        await client.query(
                            `UPDATE "ContentField"
                             SET "name" = $1, "key" = $2, "type" = $3, "required" = $4, "options" = $5, "order" = $6, "contentTypeId" = $7
                             WHERE "id" = $8`,
                            [...fieldData, field.id]
                        )
                    } else {
                        await client.query(
                            `INSERT INTO "ContentField" ("id", "name", "key", "type", "required", "options", "order", "contentTypeId")
                             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                            [crypto.randomUUID(), ...fieldData]
                        )
                    }
                }
            }

            await client.query("COMMIT")
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }

        const contentType = await getContentType(params.id)
        return NextResponse.json(contentType)

    } catch (error) {
        console.error("Error updating content type:", error)
        return NextResponse.json({ error: "Failed to update content type" }, { status: 500 })
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

        await pool.query(`DELETE FROM "ContentType" WHERE "id" = $1`, [params.id])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting content type:", error)
        return NextResponse.json({ error: "Failed to delete content type" }, { status: 500 })
    }
}