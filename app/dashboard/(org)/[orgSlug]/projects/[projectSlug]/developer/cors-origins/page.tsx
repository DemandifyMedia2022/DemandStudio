import { notFound } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { CorsOriginsList } from "@/components/dashboard/developer/cors-origins-list"

export default async function CorsOriginsPage(props: {
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
            corsOrigins: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    })

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
