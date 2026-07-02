import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"
import crypto from "crypto"

const memberAddSchema = z.object({
    email: z.string().email(),
    role: z.string().default("MEMBER"),
    password: z.string().optional(),
})

const memberUpdateSchema = z.object({
    memberId: z.string(),
    role: z.string(),
})

function withUser(member: any, user: any) {
    return { ...member, user }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const routeParams = await params;
        const session = await auth()

        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const json = await req.json()
        const body = memberAddSchema.parse(json)

        // Find user
        const userResult = await pool.query(
            `SELECT * FROM "User" WHERE "email" = $1 LIMIT 1`,
            [body.email]
        )
        let user = userResult.rows[0]

        // If user doesn't exist, create them
        if (!user) {
            if (!body.password) {
                return new NextResponse("User not found. Please provide a password to create a new user.", { status: 400 })
            }

            const bcrypt = await import("bcryptjs")
            const hashedPassword = await bcrypt.hash(body.password, 10)
            const now = new Date()

            const createdUser = await pool.query(
                `INSERT INTO "User" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $6)
                 RETURNING *`,
                [crypto.randomUUID(), body.email, body.email.split("@")[0], hashedPassword, "user", now]
            )
            user = createdUser.rows[0]
        }

        // Check availability
        const existingResult = await pool.query(
            `SELECT "id" FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`,
            [routeParams.id, user.id]
        )

        if (existingResult.rows[0]) {
            return new NextResponse("User is already a member", { status: 409 })
        }

        const now = new Date()
        const memberResult = await pool.query(
            `INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $5)
             RETURNING *`,
            [crypto.randomUUID(), routeParams.id, user.id, body.role, now]
        )

        return NextResponse.json(withUser(memberResult.rows[0], user))
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }
        console.error("ADD MEMBER ERROR:", error)
        return new NextResponse(null, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const routeParams = await params;
        const session = await auth()
        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const memberId = searchParams.get("memberId")

        if (!memberId) {
            return new NextResponse("Member ID required", { status: 400 })
        }

        await pool.query(
            `DELETE FROM "OrganizationMember" WHERE "id" = $1 AND "organizationId" = $2`,
            [memberId, routeParams.id]
        )

        return new NextResponse(null, { status: 200 })
    } catch (error) {
        return new NextResponse(null, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const routeParams = await params;
        const session = await auth()
        if (!session || session.user.role !== "admin") {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const json = await req.json()
        const body = memberUpdateSchema.parse(json)

        const memberResult = await pool.query(
            `UPDATE "OrganizationMember"
             SET "role" = $1, "updatedAt" = $2
             WHERE "id" = $3 AND "organizationId" = $4
             RETURNING *`,
            [body.role, new Date(), body.memberId, routeParams.id]
        )
        const member = memberResult.rows[0]
        const userResult = await pool.query(`SELECT * FROM "User" WHERE "id" = $1 LIMIT 1`, [member.userId])

        return NextResponse.json(withUser(member, userResult.rows[0]))
    } catch (error) {
        return new NextResponse(null, { status: 500 })
    }
}