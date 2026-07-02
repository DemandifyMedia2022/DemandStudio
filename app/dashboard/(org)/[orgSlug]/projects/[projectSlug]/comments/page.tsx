"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { 
  CheckCircle2, 
  XCircle, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Check,
  X,
  Clock,
  Filter,
  Trash2,
  FileText,
  User,
  Mail,
  MoreVertical,
  Reply
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useParams } from "next/navigation"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Comment = {
  id: string
  name: string
  email: string
  content: string
  status: "pending" | "approved" | "rejected"
  createdAt: string
  blog: {
    title: string
  }
  parentId?: string | null
  parent?: {
    content: string
  } | null
}

export default function ProjectCommentModerationPage() {
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const projectSlug = params?.projectSlug as string

  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("pending")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  useEffect(() => {
      if (orgSlug) {
      fetch("/api/organizations")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const org = data.find((o: any) => o.slug === orgSlug)
            if (org) {
              setCurrentUserRole(org.members?.[0]?.role || "MEMBER")
            }
          }
        })
        .catch(error => {
          console.error("Failed to fetch organizations for role check:", error)
          setCurrentUserRole("MEMBER") // Fallback to safe role
        })
      }
  }, [orgSlug])

  const canModerate = currentUserRole === "OWNER"

  const fetchComments = useCallback(async () => {
    if (!orgSlug || !projectSlug) return
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        status,
        search,
        page: page.toString(),
        limit: limit.toString(),
        orgSlug,
        projectSlug,
      })
      const res = await fetch(`/api/comments?${queryParams.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setComments(data.comments)
        setTotal(data.total)
      } else {
        toast.error(data.error || "Failed to fetch comments")
      }
    } catch (error) {
      toast.error("An error occurred while fetching comments")
    } finally {
      setLoading(false)
    }
  }, [status, search, page, limit, orgSlug, projectSlug])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], status: newStatus, orgSlug }),
      })
      if (res.ok) {
        toast.success(`Comment ${newStatus}`)
        // Remove from list if it no longer matches current filter
        if (status !== "all" && status !== newStatus) {
            setComments((prev: Comment[]) => prev.filter((c: Comment) => c.id !== id))
            setTotal((prev: number) => prev - 1)
        } else {
            setComments((prev: Comment[]) => prev.map((c: Comment) => c.id === id ? { ...c, status: newStatus as any } : c))
        }
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update comment")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleBulkUpdateStatus = async (newStatus: string) => {
    if (selectedIds.length === 0) return
    try {
      const res = await fetch(`/api/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, status: newStatus, orgSlug }),
      })
      if (res.ok) {
        toast.success(`${selectedIds.length} comments ${newStatus}`)
        if (status !== "all" && status !== newStatus) {
            setComments((prev: Comment[]) => prev.filter((c: Comment) => !selectedIds.includes(c.id)))
            setTotal((prev: number) => prev - selectedIds.length)
        } else {
            setComments((prev: Comment[]) => prev.map((c: Comment) => selectedIds.includes(c.id) ? { ...c, status: newStatus as any } : c))
        }
        setSelectedIds([])
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to update comments")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === comments.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(comments.map(c => c.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev: string[]) => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Comments</h1>
          <p className="text-muted-foreground">Moderate comments for your blogs in this project.</p>
        </div>
        {selectedIds.length > 0 && canModerate && (
          <div className="flex items-center gap-2 bg-primary/10 p-2 rounded-lg border border-primary/20">
            <span className="text-sm font-medium px-2">{selectedIds.length} selected</span>
            <Button size="sm" variant="default" onClick={() => handleBulkUpdateStatus("approved")}>
              <Check className="mr-1 h-4 w-4" /> Approve
            </Button>
            <Button size="sm" variant="destructive" onClick={() => handleBulkUpdateStatus("rejected")}>
              <X className="mr-1 h-4 w-4" /> Reject
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <Tabs value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Rejected
            </TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or content..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={comments.length > 0 && selectedIds.length === comments.length} 
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Blog</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">Loading comments...</TableCell>
                </TableRow>
              ) : comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No comments found for this project.
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment: Comment) => (
                  <TableRow key={comment.id} className="group">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(comment.id)} 
                        onCheckedChange={() => toggleSelectOne(comment.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" /> {comment.name}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {comment.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {comment.parentId && (
                        <div className="flex items-center gap-1.5 mb-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-100 w-fit uppercase tracking-wider">
                          <Reply className="h-3 w-3 -scale-x-100" />
                          Reply to: {comment.parent?.content ? `"${comment.parent.content.substring(0, 25)}..."` : "comment"}
                        </div>
                      )}
                      <div className={comment.parentId ? "ml-6 flex items-start gap-2" : ""}>
                        {comment.parentId && <span className="text-muted-foreground font-mono mt-0.5 shrink-0">↳</span>}
                        <p className="text-sm line-clamp-2 md:line-clamp-3 italic">"{comment.content}"</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm bg-muted/50 p-1.5 rounded border max-w-[200px]">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate" title={comment.blog?.title}>
                          {comment.blog?.title || "Unknown Blog"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(comment.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          comment.status === "approved" ? "default" :
                          comment.status === "rejected" ? "destructive" : 
                          "secondary"
                        }
                        className="capitalize"
                      >
                        {comment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {canModerate && comment.status !== "approved" && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleUpdateStatus(comment.id, "approved")}
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {canModerate && comment.status !== "rejected" && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleUpdateStatus(comment.id, "rejected")}
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {canModerate && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  toast.error("Delete functionality not requested.")
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing Page {page} of {totalPages} ({total} total comments)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1 || loading}
              onClick={() => setPage((prev: number) => prev - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="flex items-center gap-1 cursor-default">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = page
                if (totalPages > 5) {
                   if (page <= 3) pageNum = i + 1
                   else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                   else pageNum = page - 2 + i
                } else {
                   pageNum = i + 1
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages || loading}
              onClick={() => setPage((prev: number) => prev + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
