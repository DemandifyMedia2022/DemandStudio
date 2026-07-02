import { notFound } from "next/navigation"
import { pool } from "@/lib/db"
import { CorsOriginsList } from "@/components/dashboard/developer/cors-origins-list"

export default async function CorsOriginsPage(props: {
    params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
    const params = await props.params;

    const projectResult = await pool.query(
        `SELECT p.* FROM "Project" p
         INNER JOIN "Organization" o ON o."id" = p."organizationId"
         WHERE p."slug" = $1 AND o."slug" = $2
         LIMIT 1`,
        [params.projectSlug, params.orgSlug]
    )
    const project = projectResult.rows[0]

    if (project) {
        const originsResult = await pool.query(
            `SELECT * FROM "CorsOrigin" WHERE "projectId" = $1 ORDER BY "createdAt" DESC`,
            [project.id]
        )
        project.corsOrigins = originsResult.rows
    }

    if (!project) {
        notFound()
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <CorsOriginsList
                origins={project.corsOrigins}
                projectId={project.id}
                orgSlug={params.orgSlug}
                projectSlug={params.projectSlug}
            />
        </div>
    )
}
