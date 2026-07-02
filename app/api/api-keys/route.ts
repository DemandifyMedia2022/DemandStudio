import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get("projectSlug")
    const orgSlug = searchParams.get("orgSlug")

    if (!projectSlug || !orgSlug) {
      return NextResponse.json({ error: "Project context required" }, { status: 400 })
    }

    const projectResult = await pool.query(
      `SELECT p.*
       FROM "Project" p
       INNER JOIN "Organization" o ON o."id" = p."organizationId"
       WHERE p."slug" = $1 AND o."slug" = $2
       LIMIT 1`,
      [projectSlug, orgSlug]
    )
    const project = projectResult.rows[0]

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const { rows: apiKeys } = await pool.query(
      `SELECT * FROM "ApiKey"
       WHERE "userId" = $1 AND "projectId" = $2
       ORDER BY "createdAt" DESC`,
      [session.user.id, project.id]
    )

    // Don't return the full key, just a masked version
    const maskedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      key: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      active: key.active,
    }))

    return NextResponse.json({ data: maskedKeys })
  } catch (error) {
    console.error("Error fetching API keys:", error)
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, expiresInDays, projectSlug, orgSlug } = body

    if (!name || !projectSlug || !orgSlug) {
      return NextResponse.json(
        { error: "Name and project context are required" },
        { status: 400 }
      )
    }

    const projectResult = await pool.query(
      `SELECT p.*
       FROM "Project" p
       INNER JOIN "Organization" o ON o."id" = p."organizationId"
       WHERE p."slug" = $1 AND o."slug" = $2
       LIMIT 1`,
      [projectSlug, orgSlug]
    )
    const project = projectResult.rows[0]

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Generate a secure API key
    const apiKey = `cms_${crypto.randomBytes(32).toString('hex')}`

    // Calculate expiration date if provided
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null
    const now = new Date()

    const { rows } = await pool.query(
      `INSERT INTO "ApiKey" ("id", "name", "key", "userId", "projectId", "expiresAt", "active", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING *`,
      [crypto.randomUUID(), name, apiKey, session.user.id, project.id, expiresAt, true, now]
    )
    const keyRecord = rows[0]

    // Return the full key only on creation
    return NextResponse.json(
      {
        data: {
          id: keyRecord.id,
          name: keyRecord.name,
          key: apiKey, // Only return full key on creation
          expiresAt: keyRecord.expiresAt,
          createdAt: keyRecord.createdAt,
        },
        message: "API key created successfully. Save this key securely - it won't be shown again!",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating API key:", error)
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    )
  }
}