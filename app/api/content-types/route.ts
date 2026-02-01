
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const contentTypeSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase, numbers, and hyphens only"),
    description: z.string().optional(),
})

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
        const project = await prisma.project.findUnique({
            where: {
                slug: projectSlug,
                organization: { slug: orgSlug }
            }
        })

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        const contentTypes = await prisma.contentType.findMany({
            where: {
                projectId: project.id,
                ...(slug && { slug }),
            },
            include: {
                _count: {
                    select: { items: true },
                },
                fields: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: "desc" },
        })

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

        const project = await prisma.project.findUnique({
            where: {
                slug: projectSlug,
                organization: { slug: orgSlug }
            }
        })

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 })
        }

        // Check for existing slug IN THIS PROJECT
        const existing = await prisma.contentType.findFirst({
            where: {
                slug: validatedData.slug,
                projectId: project.id
            },
        })

        if (existing) {
            return NextResponse.json({ error: "Content type with this slug is already used in this project" }, { status: 400 })
        }

        const contentType = await prisma.contentType.create({
            data: {
                ...validatedData,
                projectId: project.id
            },
        })

        return NextResponse.json(contentType)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        console.error("Error creating content type:", error)
        return NextResponse.json({ error: "Failed to create content type" }, { status: 500 })
    }
}
