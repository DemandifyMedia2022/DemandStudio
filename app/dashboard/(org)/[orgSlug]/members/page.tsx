import { MembersList } from "@/components/members-list"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getOrganizationMembers } from "@/app/dashboard/actions/members"

export default async function MembersPage({ params }: { params: Promise<{ orgSlug: string }> }) {
    const { orgSlug } = await params
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const members = await getOrganizationMembers(orgSlug)
    const currentUserRole = members.find((member) => member.user.id === session.user.id)?.role
    const canManageMembers = currentUserRole === "OWNER" || currentUserRole === "ADMIN"

    return (
        <div className="min-h-screen flex flex-col">
            <DashboardHeader user={session.user} />
            <div className="flex-1 max-w-7xl w-full mx-auto space-y-8 p-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/dashboard/${orgSlug}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Members</h1>
                                <p className="text-muted-foreground mt-2">
                                    Manage the members of your organization.
                                </p>
                            </div>
                            {canManageMembers && <AddMemberDialog orgSlug={orgSlug} />}
                        </div>
                    </div>
                </div>

                <MembersList members={members} orgSlug={orgSlug} currentUserRole={currentUserRole} />
            </div>
        </div>
    )
}
