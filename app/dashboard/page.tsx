import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { pool } from "@/lib/db"

export default async function DashboardPage() {
    const session = await auth()

    if (!session || !session.user) {
        redirect("/login")
    }

    if (session.user.role === "admin") {
        redirect("/dashboard/admin/organizations")
    }

    // Redirect to first org if user has one
    const { rows } = await pool.query(
        `SELECT om.*, row_to_json(o.*) AS organization
         FROM "OrganizationMember" om
         INNER JOIN "Organization" o ON o."id" = om."organizationId"
         WHERE om."userId" = $1
         ORDER BY om."createdAt" ASC
         LIMIT 1`,
        [session.user.id]
    )
    const member = rows[0]

    if (member) {
        redirect(`/dashboard/${member.organization.slug}`)
    }

    // Fallback to user overview
    redirect("/dashboard/overview")
}