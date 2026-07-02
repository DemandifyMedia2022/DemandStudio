import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { ProjectSidebar } from "@/components/sidebars/project-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { pool } from "@/lib/db"

export default async function ProjectLayout(props: {
    children: React.ReactNode
    params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
    const params = await props.params;
    const { children } = props;
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    // Verify membership for this specific org and project existence
    const orgResult = await pool.query(`SELECT * FROM "Organization" WHERE "slug" = $1 LIMIT 1`, [params.orgSlug])
    const org = orgResult.rows[0]

    if (org) {
        const [membersResult, projectsResult] = await Promise.all([
            pool.query(`SELECT * FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2`, [org.id, session.user.id]),
            pool.query(`SELECT * FROM "Project" WHERE "organizationId" = $1 AND "slug" = $2`, [org.id, params.projectSlug]),
        ])
        org.members = membersResult.rows
        org.projects = projectsResult.rows
    }

    if (!org || org.members.length === 0) {
        redirect("/dashboard")
    }

    const project = org.projects[0];
    if (!project) {
        notFound();
    }

    return (
        <SidebarProvider>
            <ProjectSidebar user={session.user} project={project} orgSlug={org.slug} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <a href={`/dashboard/${org.slug}`} className="text-sm font-semibold hover:underline">
                            {org.name}
                        </a>
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <div className="text-sm font-medium">
                            {project.name}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ModeToggle />

                    </div>
                </header>
                <main className="flex-1 flex flex-col gap-4 p-4">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}
