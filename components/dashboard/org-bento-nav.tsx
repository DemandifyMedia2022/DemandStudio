"use client"

import { BentoGridTemplateTwo, BentoItem } from "@/components/ui/bento-grid-template-two"
import Link from "next/link"
import { ArrowRight, Layout } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Project {
    id: string
    name: string
    slug: string
    description?: string | null
    createdAt: string | Date
}

import { CreateProjectDialog } from "./create-project-dialog"

// ... imports

export function OrgBentoNav({ orgSlug, orgId, projects = [] }: { orgSlug: string, orgId: string, projects?: Project[] }) {
    const items: BentoItem[] = [
        {
            id: "projects",
            title: "Projects",
            description: "Manage your projects and content",
            // removed link to remove bottom button
            size: "large",
            variant: "highlight",
            tag: "Core",
            children: (
                <div className="mt-4 space-y-3">
                    {projects.slice(0, 3).map((project) => (
                        <Link key={project.id} href={`/dashboard/${orgSlug}/projects/${project.slug}`} className="block">
                            <div className="flex items-center space-x-3 rounded-md bg-white/10 p-2 hover:bg-white/20 transition-colors">
                                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white/20">
                                    <Layout className="h-4 w-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{project.name}</p>
                                    <p className="text-xs text-white/70 truncate">{project.description || "No description"}</p>
                                </div>
                                <div className="text-xs text-white/50 whitespace-nowrap">
                                    {formatDate(project.createdAt)}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {projects.length === 0 && (
                        <div className="text-sm text-white/70 italic">No recent projects</div>
                    )}
                    <div className="pt-2">
                        <CreateProjectDialog organizationId={orgId} orgSlug={orgSlug} />
                    </div>
                </div>
            )
        },
        {
            id: "members",
            title: "Members",
            description: "Manage team members and permissions",
            link: `/dashboard/${orgSlug}/members`,
            size: "medium",
            variant: "default",
            tag: "Team",
            cta: "View Team"
        },
        {
            id: "settings",
            title: "Settings",
            description: "Organization settings and configuration",
            link: `/dashboard/${orgSlug}/settings`,
            size: "medium",
            variant: "default",
            tag: "Config",
            cta: "Configure"
        },
        {
            id: "overview",
            title: "Overview",
            description: "dashboard analytics",
            link: `/dashboard/${orgSlug}`,
            size: "wide",
            variant: "default",
            tag: "Analytics",
            cta: "View Analytics"
        }
    ]

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-4 mt-[-20px]">Navigation</h2>
            <BentoGridTemplateTwo items={items} />
        </div>
    )
}
