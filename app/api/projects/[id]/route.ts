import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { NextResponse } from "next/server"
import * as z from "zod"

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const session = await auth()

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        const projectResult = await pool.query(
            `SELECT "organizationId" FROM "Project" WHERE "id" = $1 LIMIT 1`,
            [params.id]
        )
        const project = projectResult.rows[0]

        if (!project) {
            return new NextResponse("Not Found", { status: 404 })
        }

        // Check membership
        const membershipResult = await pool.query(
            `SELECT "role" FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`,
            [project.organizationId, session.user.id]
        )
        const membership = membershipResult.rows[0]

        if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        await pool.query(`DELETE FROM "Project" WHERE "id" = $1`, [params.id])

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        return new NextResponse(null, { status: 500 })
    }
}