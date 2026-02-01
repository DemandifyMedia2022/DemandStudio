"use client"

import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ProjectDetailsProps {
    project: {
        id: string
        name: string
        slug: string
    }
    organization: {
        id: string
        name: string
        slug: string
    }
}

export function ProjectDetails({ project, organization }: ProjectDetailsProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const copyToClipboard = (text: string, type: "Project" | "Organization") => {
        navigator.clipboard.writeText(text)
        setCopiedId(type)
        toast.success(`${type} ID copied to clipboard`)
        setTimeout(() => setCopiedId(null), 2000)
    }

    // Get initials for the logo
    const initials = project.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
            {/* Logo */}
            <div className="h-24 w-24 bg-[#38bdf8] flex items-center justify-center text-4xl font-normal text-black rounded-sm shrink-0">
                {originalInitials(project.name)}
            </div>

            <div className="space-y-1">
                {/* Org Name */}
                <div className="text-sm font-medium text-blue-500">
                    {organization.name}
                </div>

                {/* Project Name */}
                <h1 className="text-3xl font-bold tracking-tight text-white mb-3">
                    {project.name}
                </h1>

                {/* Metadata Row */}
                <div className="flex flex-wrap gap-x-12 gap-y-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    <div className="flex flex-col gap-1">
                        <span>Plan</span>
                        <span className="text-white text-sm font-medium capitalize">Free</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span>Status</span>
                        <span className="text-emerald-500 text-sm font-medium capitalize">Active</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span>Project ID</span>
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(project.id, "Project")}>
                            <span className="text-gray-300 font-mono text-sm lowercase font-normal">{project.id}</span>
                            {copiedId === "Project" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span>Organization ID</span>
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(organization.id, "Organization")}>
                            <span className="text-gray-300 font-mono text-sm font-normal">{organization.id}</span>
                            {copiedId === "Organization" ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                            ) : (
                                <Copy className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function originalInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}
