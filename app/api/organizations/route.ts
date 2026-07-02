import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"
import crypto from "crypto"

const orgCreateSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
})

export async function GET(req: Request) {
    try {
        const session = await auth()

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { rows: orgs } = await pool.query(
            `SELECT o."id", o."name", o."slug"
             FROM "Organization" o
             INNER JOIN "OrganizationMember" om ON om."organizationId" = o."id"
             WHERE om."userId" = $1`,
            [session.user.id]
        )

        return NextResponse.json(orgs)
    } catch (error) {
        return new NextResponse(null, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // TODO: Verify if user is superadmin if restricting org creation
        // For now, allow logged in users to create orgs to test

        const json = await req.json()
        const body = orgCreateSchema.parse(json)

        // Check if slug exists
        const existingResult = await pool.query(
            `SELECT "id" FROM "Organization" WHERE "slug" = $1 LIMIT 1`,
            [body.slug]
        )

        if (existingResult.rows[0]) {
            return new NextResponse("Organization with this slug already exists", { status: 409 })
        }

        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            const now = new Date()
            const orgResult = await client.query(
                `INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $4)
                 RETURNING *`,
                [crypto.randomUUID(), body.name, body.slug, now]
            )
            const org = orgResult.rows[0]

            await client.query(
                `INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $5)`,
                [crypto.randomUUID(), org.id, session.user.id, "OWNER", now]
            )

            await client.query("COMMIT")
            return NextResponse.json(org)
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        console.error("ORG CREATE ERROR:", error)
        return new NextResponse(null, { status: 500 })
    }
}