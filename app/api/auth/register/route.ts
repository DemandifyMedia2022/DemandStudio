import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { pool } from "@/lib/db"
import { z } from "zod"
import crypto from "crypto"

// Define validation schema
const userSchema = z.object({
    organizationName: z.string().min(1, "Organization name is required"),
    name: z.string().min(1, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name, organizationName } = userSchema.parse(body)

        // Check if email already exists
        const existingResult = await pool.query(
            `SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1`,
            [email]
        )

        if (existingResult.rows[0]) {
            return NextResponse.json(
                { user: null, message: "User with this email already exists" },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 10)

        const client = await pool.connect()
        try {
            await client.query("BEGIN")
            const now = new Date()

            // 1. Create User
            const userResult = await client.query(
                `INSERT INTO "User" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $6, $6)
                 RETURNING *`,
                [crypto.randomUUID(), email, name, hashedPassword, "user", now]
            )
            const user = userResult.rows[0]

            // 2. Generate Organization Slug
            // Slug based on Organization Name
            const baseSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            const slug = `${baseSlug}-${Date.now()}`

            // 3. Create Organization
            const organizationResult = await client.query(
                `INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $4)
                 RETURNING *`,
                [crypto.randomUUID(), organizationName, slug, now]
            )
            const organization = organizationResult.rows[0]

            // 4. Create Membership (Owner)
            await client.query(
                `INSERT INTO "OrganizationMember" ("id", "userId", "organizationId", "role", "createdAt", "updatedAt")
                 VALUES ($1, $2, $3, $4, $5, $5)`,
                [crypto.randomUUID(), user.id, organization.id, "OWNER", now]
            )

            await client.query("COMMIT")

            // Remove password from response
            const { password: newUserPassword, ...rest } = user

            return NextResponse.json(
                {
                    user: rest,
                    message: "User created successfully",
                    redirectUrl: `/dashboard/${organization.slug}`,
                    organizationSlug: organization.slug
                },
                { status: 201 }
            )
        } catch (error) {
            await client.query("ROLLBACK")
            throw error
        } finally {
            client.release()
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { user: null, message: "Invalid input", errors: error.issues },
                { status: 400 }
            )
        }

        console.error("Registration error:", error)
        return NextResponse.json(
            { user: null, message: "Something went wrong" },
            { status: 500 }
        )
    }
}