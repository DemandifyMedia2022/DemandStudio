import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"

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

    // Verify the API key belongs to the user
    const apiKeyResult = await pool.query(
      `SELECT * FROM "ApiKey" WHERE "id" = $1 LIMIT 1`,
      [params.id]
    )
    const apiKey = apiKeyResult.rows[0]

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    if (apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await pool.query(`DELETE FROM "ApiKey" WHERE "id" = $1`, [params.id])

    return NextResponse.json({ message: "API key deleted successfully" })
  } catch (error) {
    console.error("Error deleting API key:", error)
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    )
  }
}

export async function PATCH(
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
    const { active, name } = body

    // Verify the API key belongs to the user
    const apiKeyResult = await pool.query(
      `SELECT * FROM "ApiKey" WHERE "id" = $1 LIMIT 1`,
      [params.id]
    )
    const apiKey = apiKeyResult.rows[0]

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 })
    }

    if (apiKey.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updatedResult = await pool.query(
      `UPDATE "ApiKey"
       SET "active" = COALESCE($1, "active"),
           "name" = COALESCE($2, "name"),
           "updatedAt" = $3
       WHERE "id" = $4
       RETURNING *`,
      [active === undefined ? null : active, name || null, new Date(), params.id]
    )
    const updated = updatedResult.rows[0]

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        active: updated.active,
        lastUsed: updated.lastUsed,
        expiresAt: updated.expiresAt,
      },
    })
  } catch (error) {
    console.error("Error updating API key:", error)
    return NextResponse.json(
      { error: "Failed to update API key" },
      { status: 500 }
    )
  }
}