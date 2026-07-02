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

        // Check permissions
        // Allow if user is OWNER of the org OR SUPERADMIN (future)
        const membershipResult = await pool.query(
            `SELECT * FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`,
            [params.id, session.user.id]
        )
        const membership = membershipResult.rows[0]

        // TODO: Add Superadmin check here too
        if (!membership || membership.role !== "OWNER") {
            return new NextResponse("Forbidden", { status: 403 })
        }

        await pool.query(`DELETE FROM "Organization" WHERE "id" = $1`, [params.id])

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new NextResponse(JSON.stringify(error.issues), { status: 422 })
        }

        return new NextResponse(null, { status: 500 })
    }
}