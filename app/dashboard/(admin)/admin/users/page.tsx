import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { pool } from "@/lib/db"
import { UsersList } from "@/components/admin/users-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function AdminUsersPage() {
    const session = await auth()

    if (!session || session.user.role !== "admin") {
        redirect("/login")
    }

    const { rows: users } = await pool.query(`SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 50`)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground">
                        Manage users and their roles.
                    </p>
                </div>
                {/* 
                // TODO: Implement Invite/Create User Dialog for global users if needed
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Invite User
                </Button> 
                */}
            </div>

            <UsersList users={users} />
        </div>
    )
}
