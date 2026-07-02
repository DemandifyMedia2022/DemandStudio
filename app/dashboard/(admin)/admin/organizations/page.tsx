import { pool } from "@/lib/db"
import { OrgList } from "@/components/admin/org-list"
import { OrgForm } from "@/components/admin/org-form"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Organization Management",
    description: "Manage organizations and their permissions",
}

export default async function OrganizationsPage() {
    const { rows: organizations } = await pool.query(
        `SELECT o.*,
          json_build_object(
            'projects', (SELECT COUNT(*)::int FROM "Project" p WHERE p."organizationId" = o."id"),
            'members', (SELECT COUNT(*)::int FROM "OrganizationMember" m WHERE m."organizationId" = o."id")
          ) AS _count
         FROM "Organization" o
         ORDER BY o."createdAt" DESC`
    )

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
                <div className="flex items-center space-x-2">
                    <OrgForm />
                </div>
            </div>
            <OrgList organizations={organizations} />
        </div>
    )
}
