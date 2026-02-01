"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Plus, Trash, Globe } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { addCorsOrigin, deleteCorsOrigin } from "@/actions/cors-actions"

interface CorsOrigin {
    id: string
    origin: string
    createdAt: Date
    projectId: string
}

interface CorsOriginsListProps {
    origins: CorsOrigin[]
    projectId: string
    orgSlug: string
    projectSlug: string
}

export function CorsOriginsList({ origins, projectId, orgSlug, projectSlug }: CorsOriginsListProps) {
    const [open, setOpen] = useState(false)
    const [newOrigin, setNewOrigin] = useState("")
    const [loading, setLoading] = useState(false)

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newOrigin) return

        setLoading(true)
        try {
            const result = await addCorsOrigin({
                origin: newOrigin,
                projectId,
                orgSlug,
                projectSlug
            })

            if (result.success) {
                toast.success("CORS origin added")
                setNewOrigin("")
                setOpen(false)
            } else {
                toast.error("Failed to add origin")
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this origin?")) return

        try {
            const result = await deleteCorsOrigin(id, orgSlug, projectSlug)
            if (result.success) {
                toast.success("CORS origin removed")
            } else {
                toast.error("Failed to remove origin")
            }
        } catch (error) {
            toast.error("Something went wrong")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">CORS origins</h2>
                    <p className="text-sm text-muted-foreground">
                        Hosts that can connect to the project API.
                    </p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add CORS origin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleAdd}>
                            <DialogHeader>
                                <DialogTitle>Add CORS origin</DialogTitle>
                                <DialogDescription>
                                    Add a new domain that is allowed to access your API.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="origin">Origin URL</Label>
                                    <Input
                                        id="origin"
                                        placeholder="https://example.com"
                                        value={newOrigin}
                                        onChange={(e) => setNewOrigin(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Adding..." : "Add Origin"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ORIGIN</TableHead>
                            <TableHead>CREDENTIALS</TableHead>
                            <TableHead>CREATED</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {origins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No origins added yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            origins.map((origin) => (
                                <TableRow key={origin.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-muted-foreground" />
                                            {origin.origin}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:text-emerald-500 border-emerald-500/20">
                                            Allowed
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {format(new Date(origin.createdAt), "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(origin.id)}
                                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                        >
                                            <Trash className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
