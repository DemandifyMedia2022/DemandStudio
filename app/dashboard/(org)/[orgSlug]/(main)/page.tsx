import { notFound } from "next/navigation"
import { pool } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Greeting } from "@/components/dashboard/dashboard-widgets"
import { OrgBentoNav } from "@/components/dashboard/org-bento-nav"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardFeatureSection } from "@/components/dashboard/dashboard-feature-section"
import { Footer } from "@/components/footer"

export default async function OrgDashboardPage(props: {
    params: Promise<{ orgSlug: string }>
}) {
    const params = await props.params;
    const session = await auth()

    if (!session) {
        return null
    }

    const orgResult = await pool.query(`SELECT * FROM "Organization" WHERE "slug" = $1 LIMIT 1`, [params.orgSlug])
    const org = orgResult.rows[0]

    if (org) {
        const [membersResult, projectsResult] = await Promise.all([
            pool.query(`SELECT * FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2`, [org.id, session.user.id]),
            pool.query(`SELECT * FROM "Project" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 5`, [org.id]),
        ])
        org.members = membersResult.rows
        org.projects = projectsResult.rows
    }

    if (!org) {
        notFound()
    }

    if (org.members.length === 0) {
        return notFound()
    }

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader user={session.user} />
            <div className="flex-1 max-w-[1400px] w-full mx-auto space-y-8 p-4">
                <Greeting orgName={org.name} />

                <div className="mb-8">
                    <OrgBentoNav orgSlug={org.slug} orgId={org.id} projects={org.projects} />
                </div>

                <DashboardFeatureSection />
            </div>
            <Footer />
        </div>
    )
}
