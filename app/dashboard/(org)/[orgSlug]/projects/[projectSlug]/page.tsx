import { notFound } from "next/navigation"
import { pool } from "@/lib/db"
import { ProjectDetails } from "@/components/dashboard/project-details"
import { ProjectGetStarted } from "@/components/dashboard/project-get-started"

export default async function ProjectDashboardPage(props: {
    params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
    const params = await props.params;

    const { rows } = await pool.query(
        `SELECT p.*, row_to_json(o.*) AS organization
         FROM "Project" p
         INNER JOIN "Organization" o ON o."id" = p."organizationId"
         WHERE p."slug" = $1 AND o."slug" = $2
         LIMIT 1`,
        [params.projectSlug, params.orgSlug]
    )
    const project = rows[0]

    if (!project) {
        notFound()
    }

    return (
        <div className="flex-1 space-y-8 p-8 pt-6">
            <ProjectDetails
                project={project}
                organization={project.organization}
            />

            {/* Add more project-specific overview stats/widgets here later */}
            <div>
                <ProjectGetStarted orgSlug={params.orgSlug} projectSlug={params.projectSlug} />
            </div>
        </div>
    )
}
