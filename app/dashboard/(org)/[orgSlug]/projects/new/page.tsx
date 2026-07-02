import { notFound } from "next/navigation"
import { pool } from "@/lib/db"
import { auth } from "@/lib/auth"
import { CreateProjectForm } from "@/components/dashboard/create-project-form"

export default async function CreateProjectPage(props: {
    params: Promise<{ orgSlug: string }>
}) {
    const params = await props.params;
    const session = await auth()

    if (!session) {
        return notFound()
    }

    const orgResult = await pool.query(
        `SELECT "id", "name", "slug" FROM "Organization" WHERE "slug" = $1 LIMIT 1`,
        [params.orgSlug]
    )
    const org = orgResult.rows[0]

    if (org) {
        const membersResult = await pool.query(
            `SELECT * FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2`,
            [org.id, session.user.id]
        )
        org.members = membersResult.rows
    }

    if (!org) {
        notFound()
    }

    if (org.members.length === 0) {
        return notFound()
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new project to {org.name}.
                </p>
            </div>

            <CreateProjectForm organizationId={org.id} orgSlug={org.slug} />
        </div>
    )
}
