import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"
import crypto from "crypto"

const projectCreateSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional(),
    organizationId: z.string(),
})

export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const json = await req.json()
        const body = projectCreateSchema.parse(json)

        // Check membership
        const membershipResult = await pool.query(
            `SELECT "id" FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`,
            [body.organizationId, session.user.id]
        )

        if (!membershipResult.rows[0]) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        // Check project slug uniqueness (globally or per org? Schema says unique globally)
        const existingResult = await pool.query(
            `SELECT "id" FROM "Project" WHERE "slug" = $1 LIMIT 1`,
            [body.slug]
        )

        if (existingResult.rows[0]) {
            return new NextResponse("Project with this slug already exists", { status: 409 })
        }

        const now = new Date()
        const projectResult = await pool.query(
            `INSERT INTO "Project" ("id", "name", "slug", "description", "organizationId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $6)
             RETURNING *`,
            [crypto.randomUUID(), body.name, body.slug, body.description || null, body.organizationId, now]
        )

        return NextResponse.json(projectResult.rows[0])
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error("PROJECT CREATION ERROR:", error)
        return new NextResponse(null, { status: 500 })
    }
}