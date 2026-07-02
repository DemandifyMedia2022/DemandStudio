"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { updateMemberRole, removeMember } from "@/app/dashboard/actions/members"
import { toast } from "sonner"
import { useState } from "react"

interface Member {
    id: string
    role: string
    createdAt: Date
    user: {
        id: string
        name: string | null
        email: string
        image: string | null
    }
}

interface MembersListProps {
    members: Member[]
    orgSlug: string
    currentUserRole?: string
}

export function MembersList({ members, orgSlug, currentUserRole }: MembersListProps) {
    const [isUpdating, setIsUpdating] = useState(false)
    const canManageMembers = currentUserRole === "OWNER" || currentUserRole === "ADMIN" || currentUserRole === "MEMBER"

    const handleRoleChange = async (memberId: string, newRole: string) => {
        setIsUpdating(true)
        try {
            await updateMemberRole(orgSlug, memberId, newRole)
            toast.success(`Role updated to ${newRole}`)
        } catch (error) {
            toast.error("Failed to update role")
        } finally {
            setIsUpdating(false)
        }
    }

    const handleRemove = async (memberId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return
        setIsUpdating(true)
        try {
            await removeMember(orgSlug, memberId)
            toast.success("Member removed")
        } catch (error) {
            toast.error("Failed to remove member")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        {canManageMembers && <TableHead className="w-[100px]"></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => (
                        <TableRow key={member.id}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={member.user.image || ""} />
                                    <AvatarFallback>{member.user.name?.[0] || member.user.email[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium">{member.user.name || "Unknown"}</div>
                                    <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                </div>
                            </TableCell>
                            <TableCell>
                                {canManageMembers && member.role !== "OWNER" ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="w-[100px] justify-between">
                                                {member.role}
                                                <MoreHorizontal className="h-3 w-3 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, "MEMBER")}>
                                                MEMBER
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, "VIEWER")}>
                                                VIEWER
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : (
                                    <Badge variant="secondary">{member.role}</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {new Date(member.createdAt).toLocaleDateString()}
                            </TableCell>
                            {canManageMembers && (
                                <TableCell>
                                    {member.role !== "OWNER" && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                            onClick={() => handleRemove(member.id)}
                                            disabled={isUpdating}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
