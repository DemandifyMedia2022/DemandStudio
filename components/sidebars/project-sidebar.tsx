"use client"

import * as React from "react"
import {
    LayoutDashboard,
    FileText,
    Key,
    Database,
    GalleryVerticalEnd,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"

// Types
type User = {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
}

type Project = {
    id: string
    name: string
    slug: string
}

type ContentType = {
    id: string
    name: string
    slug: string
}

export function ProjectSidebar({
    user,
    project,
    orgSlug,
    ...props
}: React.ComponentProps<typeof Sidebar> & { user: User, project: Project, orgSlug: string }) {
    const pathname = usePathname()
    const [contentTypes, setContentTypes] = React.useState<ContentType[]>([])

    // Fetch content types for this project? 
    // Wait, content types are global or per project? 
    // In UserSidebar they were fetched globally from /api/content-types.
    // Assuming they are global for now or we will need to scope them to project later.
    // For now, let's just fetch them as before.
    React.useEffect(() => {
        if (!project?.slug || !orgSlug) return
        fetch(`/api/content-types?projectSlug=${project.slug}&orgSlug=${orgSlug}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setContentTypes(data)
            })
            .catch(console.error)
    }, [])

    const data = React.useMemo(() => {
        const baseUrl = `/dashboard/${orgSlug}/projects/${project.slug}`

        return {
            user: {
                name: user.name || "User",
                email: user.email || "",
                avatar: user.image || "",
            },
            navMain: [
                {
                    title: "Dashboard",
                    url: baseUrl,
                    icon: LayoutDashboard,
                    isActive: pathname === baseUrl,
                    items: [],
                },
                {
                    title: "Content",
                    url: "#",
                    icon: FileText,
                    isActive: true,
                    items: [
                        {
                            title: "Posts",
                            url: `${baseUrl}/posts`,
                            isActive: pathname.startsWith(`${baseUrl}/posts`),
                        },
                        {
                            title: "Blogs",
                            url: `${baseUrl}/blogs`,
                            isActive: pathname.startsWith(`${baseUrl}/blogs`),
                        },
                        ...contentTypes.map(type => ({
                            title: type.name,
                            url: `${baseUrl}/content/${type.slug}`,
                            isActive: pathname.startsWith(`${baseUrl}/content/${type.slug}`),
                        }))
                    ],
                },
                {
                    title: "Dynamic Content",
                    url: "#",
                    icon: Database,
                    isActive: pathname.startsWith(`${baseUrl}/builder`),
                    items: [
                        {
                            title: "Schema Builder",
                            url: `${baseUrl}/builder`,
                            isActive: pathname.startsWith(`${baseUrl}/builder`),
                        },
                    ],
                },
                {
                    title: "Developer",
                    url: "#",
                    icon: Key,
                    items: [
                        {
                            title: "API Keys",
                            url: `${baseUrl}/api-keys`,
                            isActive: pathname.startsWith(`${baseUrl}/api-keys`),
                        },
                        {
                            title: "API Docs",
                            url: `${baseUrl}/api-docs`,
                            isActive: pathname.startsWith(`${baseUrl}/api-docs`),
                        },
                        {
                            title: "CORS Origins",
                            url: `${baseUrl}/developer/cors-origins`,
                            isActive: pathname.startsWith(`${baseUrl}/developer/cors-origins`),
                        },
                    ],
                }
            ],
        }
    }, [user, pathname, contentTypes, project.slug, orgSlug])

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 font-bold text-lg text-sidebar-foreground">
                        <GalleryVerticalEnd className="h-6 w-6" />
                        <span className="truncate">DemandStudio</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
