import { notFound } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { ProjectDetails } from "@/components/dashboard/project-details"

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

            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">Project Overview</h2>
                <p className="text-muted-foreground">
                    Welcome to your project dashboard. Manage your content and settings here.
                </p>
            </div>
            {/* Add more project-specific overview stats/widgets here later */}
        </div>
    )
}
