import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"

const contentTypeSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
    description: z.string().optional(),
})

async function findProject(projectSlug: string, orgSlug: string) {
    const { rows } = await pool.query(
        `SELECT p.* FROM "Project" p
         INNER JOIN "Organization" o ON o."id" = p."organizationId"
         WHERE p."slug" = $1 AND o."slug" = $2
         LIMIT 1`,
        [projectSlug, orgSlug]
    )
    return rows[0]
}

async function attachFieldsAndCounts(contentTypes: any[]) {
    return Promise.all(contentTypes.map(async (contentType) => {
        const fieldsResult = await pool.query(
            `SELECT * FROM "ContentField" WHERE "contentTypeId" = $1 ORDER BY "order" ASC`,
            [contentType.id]
        )
        const countResult = await pool.query(
            `SELECT COUNT(*)::int AS count FROM "ContentItem" WHERE "contentTypeId" = $1`,
            [contentType.id]
        )
        return {
            ...contentType,
            fields: fieldsResult.rows,
            _count: { items: countResult.rows[0]?.count ?? 0 },
        }
    }))
}

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const projectSlug = searchParams.get("projectSlug")
        const orgSlug = searchParams.get("orgSlug")
        const slug = searchParams.get("slug")

        if (!projectSlug || !orgSlug) {
            return NextResponse.json({ error: "Project context required" }, { status: 400 })
        }

        // Verify project access
        const project = await findProject(projectSlug, orgSlug)

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const params: any[] = [project.id]
        let sql = `SELECT * FROM "ContentType" WHERE "projectId" = $1`
        if (slug) {
            params.push(slug)
            sql += ` AND "slug" = $2`
        }
        sql += ` ORDER BY "createdAt" DESC`

        const { rows } = await pool.query(sql, params)
        const contentTypes = await attachFieldsAndCounts(rows)

        return NextResponse.json(contentTypes)
    } catch (error) {
        console.error("Error fetching content types:", error)
        return NextResponse.json({ error: "Failed to fetch content types" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { orgSlug, projectSlug, ...data } = body
        const validatedData = contentTypeSchema.parse(data)

        if (!projectSlug || !orgSlug) {
            return NextResponse.json({ error: "Project context required" }, { status: 400 })
        }

        const project = await findProject(projectSlug, orgSlug)

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        // Check for existing slug IN THIS PROJECT
        const existingResult = await pool.query(
            `SELECT "id" FROM "ContentType" WHERE "slug" = $1 AND "projectId" = $2 LIMIT 1`,
            [validatedData.slug, project.id]
        )

        if (existingResult.rows[0]) {
            return NextResponse.json({ error: "Content type with this slug is already used in this project" }, { status: 400 })
        }

        const now = new Date()
        const { rows } = await pool.query(
            `INSERT INTO "ContentType" ("id", "name", "slug", "description", "projectId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $6)
             RETURNING *`,
            [crypto.randomUUID(), validatedData.name, validatedData.slug, validatedData.description || null, project.id, now]
        )

        return NextResponse.json(rows[0])
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        console.error("Error creating content type:", error)
        return NextResponse.json({ error: "Failed to create content type" }, { status: 500 })
    }
}