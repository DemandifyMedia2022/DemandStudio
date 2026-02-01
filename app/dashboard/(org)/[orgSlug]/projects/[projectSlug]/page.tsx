import { notFound } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { ProjectDetails } from "@/components/dashboard/project-details"
import { ProjectGetStarted } from "@/components/dashboard/project-get-started"

export default async function ProjectDashboardPage(props: {
    params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
    const params = await props.params;

    const project = await db.project.findUnique({
        where: {
            slug: params.projectSlug,
            organization: {
                slug: params.orgSlug
            }
        },
        include: {
            organization: true
        }
    })

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
