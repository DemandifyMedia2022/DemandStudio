"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, FileText, Settings, Star, ArrowRight, Layout, Bell, Activity } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { CursorHighlight } from "@/components/ui/cursor-highlight"

export function Greeting({ orgName }: { orgName: string }) {
    // Determine time of day
    const hour = new Date().getHours()
    let greeting = "Good evening"
    if (hour < 12) greeting = "Good morning"
    else if (hour < 18) greeting = "Good afternoon"

    return (
        <div className="flex flex-col gap-1 pb-8 text-center pt-4" suppressHydrationWarning>
            <h1 className="text-3xl font-bold tracking-tight">
                {greeting}, <CursorHighlight
                    containerClassName="inline-flex align-bottom"
                    className="text-3xl font-bold tracking-tight"
                    gradient="from-blue-600 via-purple-600 to-purple-700"
                    rectangle={false}
                    text={orgName}
                />
            </h1>
        </div>
    )
}

interface Project {
    id: string
    name: string
    slug: string
    description?: string | null
    createdAt: string | Date
}

export function RecentProjectsWidget({ projects, orgSlug }: { projects: Project[], orgSlug: string }) {
    return (
        <Card className="col-span-1 md:col-span-2 lg:col-span-2 overflow-hidden border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">Recent Projects</CardTitle>
                <Link href={`/dashboard/${orgSlug}/projects`} className="text-xs text-muted-foreground hover:underline flex items-center">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4">
                {projects.slice(0, 3).map((project) => (
                    <Link key={project.id} href={`/dashboard/${orgSlug}/projects/${project.slug}`}>
                        <div className="flex items-center space-x-4 rounded-md border p-3 hover:bg-accent hover:text-accent-foreground transition-colors group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-sm border bg-accent/50 group-hover:bg-background">
                                <Layout className="h-5 w-5" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium leading-none">{project.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{project.description || "No description"}</p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatDate(project.createdAt)}
                            </div>
                        </div>
                    </Link>
                ))}
                {projects.length === 0 && (
                    <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                        No projects found
                    </div>
                )}
                <Link href={`/dashboard/${orgSlug}/projects/new`} className="w-full">
                    <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-primary">
                        <Layout className="mr-2 h-4 w-4" />
                        Create new project
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}

export function NotificationsWidget() {
    return (
        <Card className="col-span-1 md:col-span-1 lg:col-span-1 border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader>
                <CardTitle className="text-base font-medium">Notifications</CardTitle>
                <CardDescription>You have no new notifications</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span>Mentions</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Replies</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Tasks</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function FavoritesWidget() {
    return (
        <Card className="col-span-1 border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader>
                <CardTitle className="text-base font-medium">Favorites</CardTitle>
                <CardDescription>You have not favorited any content</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground">
                    Look for the star next to your document titles and favorite content to quickly access it here.
                </div>
            </CardContent>
        </Card>
    )
}

export function ActivityWidget() {
    return (
        <Card className="col-span-1 md:col-span-3 lg:col-span-2 border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                    <CardTitle className="text-base font-medium">Activity</CardTitle>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span className="bg-accent/50 px-2 py-0.5 rounded text-xs text-foreground">Your recently viewed</span>
                    <span className="cursor-pointer hover:text-foreground">What others are working on</span>
                </div>
            </CardHeader>
            <CardContent className="h-[200px] flex items-center justify-center text-center">
                <div className="space-y-2">
                    <p className="text-sm font-medium">No recently viewed documents</p>
                    <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                        Documents you view in studios and applications will show up here.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

export function InsightsWidget() {
    return (
        <Card className="col-span-1 border-border/50 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader>
                <CardTitle className="text-base font-medium">Insights</CardTitle>
                <CardDescription className="flex items-center">
                    <span className="text-xs">For pinned studios</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[100px] flex items-center items-start">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Activity className="h-4 w-4" />
                    <span>No Insights available</span>
                </div>
            </CardContent>
        </Card>
    )
}
