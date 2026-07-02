import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const routeParams = await params;
        const session = await auth()

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 })
        }

        // Verify membership
        const membershipResult = await pool.query(
            `SELECT "id" FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`,
            [routeParams.id, session.user.id]
        )

        if (!membershipResult.rows[0]) {
            return new NextResponse("Forbidden", { status: 403 })
        }

        const { rows: projects } = await pool.query(
            `SELECT "id", "name", "slug", "description"
             FROM "Project"
             WHERE "organizationId" = $1
             ORDER BY "createdAt" DESC`,
            [routeParams.id]
        )

        return NextResponse.json(projects)
    } catch (error) {
        return new NextResponse(null, { status: 500 })
    }
}