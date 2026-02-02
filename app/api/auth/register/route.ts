
import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { user: null, message: "User with this email already exists" },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 10)

        // Create new user, organization, and membership in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    role: "user", // Explicitly set role to user
                },
            })

            // 2. Generate Organization Slug
            // Slug based on Organization Name
            const baseSlug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-')
            const slug = `${baseSlug}-${Date.now()}`

            // 3. Create Organization
            const organization = await tx.organization.create({
                data: {
                    name: organizationName,
                    slug: slug,
                },
            })

            // 4. Create Membership (Owner)
            await tx.organizationMember.create({
                data: {
                    userId: user.id,
                    organizationId: organization.id,
                    role: "OWNER",
                },
            })

            return { user, organization }
        })

        const newUser = result.user
        const newOrg = result.organization

        // Remove password from response
        const { password: newUserPassword, ...rest } = newUser

        return NextResponse.json(
            {
                user: rest,
                message: "User created successfully",
                redirectUrl: `/dashboard/${newOrg.slug}`,
                organizationSlug: newOrg.slug
            },
            { status: 201 }
        )
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
