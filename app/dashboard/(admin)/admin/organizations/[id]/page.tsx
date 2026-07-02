import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { pool } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { OrgMembersManager } from "@/components/admin/org-members-manager"

export default async function AdminOrgDetailsPage(props: {
    params: Promise<{ id: string }>
}) {
    const params = await props.params;
    const session = await auth()

    if (!session || session.user.role !== "admin") {
        redirect("/login")
    }

    const orgResult = await pool.query(`SELECT * FROM "Organization" WHERE "id" = $1 LIMIT 1`, [params.id])
    const org = orgResult.rows[0]

    if (org) {
        const [membersResult, projectsResult, memberCountResult, projectCountResult] = await Promise.all([
            pool.query(
                `SELECT om.*, row_to_json(u.*) AS user
                 FROM "OrganizationMember" om
                 INNER JOIN "User" u ON u."id" = om."userId"
                 WHERE om."organizationId" = $1`,
                [org.id]
            ),
            pool.query(`SELECT * FROM "Project" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC`, [org.id]),
            pool.query(`SELECT COUNT(*)::int AS count FROM "OrganizationMember" WHERE "organizationId" = $1`, [org.id]),
            pool.query(`SELECT COUNT(*)::int AS count FROM "Project" WHERE "organizationId" = $1`, [org.id]),
        ])
        org.members = membersResult.rows
        org.projects = projectsResult.rows
        org._count = {
            members: memberCountResult.rows[0]?.count ?? 0,
            projects: projectCountResult.rows[0]?.count ?? 0,
        }
    }

    if (!org) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <h2 className="text-xl font-bold">Organization not found</h2>
                <Link href="/dashboard/admin/organizations">
                    <Button variant="link">Back to Organizations</Button>
                </Link>
            </div>
        )
    }

    // Transform members to match OrgMembersManager interface strictly if needed.
    const sanitizedMembers = org.members.map((m: any) => ({
        id: m.id,
        role: m.role,
        user: {
            id: m.user.id,
            name: m.user.name,
            email: m.user.email
        }
    }))

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/admin/organizations">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
                    <p className="text-muted-foreground">Manage organization details and members</p>
                </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Basic information about the organization</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={org.name} disabled readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={org.slug} disabled readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>ID</Label>
                            <Input value={org.id} disabled readOnly className="font-mono text-xs" />
                        </div>
                        <div className="space-y-2">
                            <Label>Created At</Label>
                            <div className="text-sm">{formatDate(org.createdAt)}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>Quick stats</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <h3 className="text-base font-semibold">Total Members</h3>
                            </div>
                            <div className="text-2xl font-bold">{org._count.members}</div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <h3 className="text-base font-semibold">Total Projects</h3>
                            </div>
                            <div className="text-2xl font-bold">{org._count.projects}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <OrgMembersManager orgId={org.id} initialMembers={sanitizedMembers} />
        </div>
    )
}

