import { notFound } from "next/navigation"
import { prisma as db } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { Greeting } from "@/components/dashboard/dashboard-widgets"
import { OrgBentoNav } from "@/components/dashboard/org-bento-nav"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"

export default async function OrgDashboardPage(props: {
    params: Promise<{ orgSlug: string }>
}) {
    const params = await props.params;
    const session = await auth()

    if (!session) {
        return null
    }

    const org = await db.organization.findUnique({
        where: {
            slug: params.orgSlug,
        },
        include: {
            members: {
                where: {
                    userId: session.user.id,
                },
            },
            projects: {
                orderBy: {
                    createdAt: "desc",
                },
                take: 5
            },
        },
    })

    if (!org) {
        notFound()
    }

    if (org.members.length === 0) {
        return notFound()
    }

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader user={session.user} />
            <div className="flex-1 max-w-6xl w-full mx-auto space-y-8 p-4">
                <Greeting orgName={org.name} />

                <div className="mb-8">
                    <OrgBentoNav orgSlug={org.slug} orgId={org.id} projects={org.projects} />
                </div>
            </div>
        </div>
    )
}
