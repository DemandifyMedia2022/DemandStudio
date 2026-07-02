import Link from "next/link"
import { pool } from "@/lib/db"
import { auth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Eye } from "lucide-react"
import { format } from "date-fns"
import { DeleteBlogButton } from "@/components/blogs/delete-button"
import { BlogFilters } from "@/components/blogs/blog-filters"

export const dynamic = "force-dynamic"

type BlogWithAuthor = {
  id: string
  title: string
  slug: string
  category: string | null
  subcategory: string | null
  status: string | null
  published: boolean
  createdAt: Date
  author: {
    name: string | null
    email: string | null
  } | null
}

export default async function BlogsPage(props: {
  params: Promise<{ orgSlug: string; projectSlug: string }>
  searchParams: Promise<{ category?: string; subcategory?: string; status?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const session = await auth()

  if (!session) return null

  const projectResult = await pool.query(
    `SELECT p.* FROM "Project" p
     INNER JOIN "Organization" o ON o."id" = p."organizationId"
     WHERE p."slug" = $1 AND o."slug" = $2
     LIMIT 1`,
    [params.projectSlug, params.orgSlug]
  )
  const project = projectResult.rows[0]

  if (!project) return null

  let blogs: BlogWithAuthor[] = []
  try {
    const queryParams: unknown[] = [project.id]
    const whereClauses = [`b."projectId" = $1`]

    if (searchParams.category) {
      queryParams.push(searchParams.category)
      whereClauses.push(`b."category" = $${queryParams.length}`)
    }

    if (searchParams.subcategory) {
      queryParams.push(searchParams.subcategory)
      whereClauses.push(`b."subcategory" = $${queryParams.length}`)
    }

    if (searchParams.status) {
      queryParams.push(searchParams.status)
      whereClauses.push(`CASE WHEN b."published" THEN 'published' ELSE COALESCE(NULLIF(b."status", ''), 'draft') END = $${queryParams.length}`)
    }

    const blogsResult = await pool.query(
      `SELECT b.*,
        CASE WHEN u."id" IS NULL THEN NULL ELSE json_build_object('name', u."name", 'email', u."email") END AS author
       FROM "Blog" b
       LEFT JOIN "User" u ON u."id" = b."authorId"
       WHERE ${whereClauses.join(" AND ")}
       ORDER BY b."createdAt" DESC`,
      queryParams
    )
    blogs = blogsResult.rows
  } catch (error) {
    console.error("Failed to fetch blogs:", error)
    blogs = []
  }

  const baseUrl = `/dashboard/${params.orgSlug}/projects/${params.projectSlug}`

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blogs</h1>
        <Link href={`${baseUrl}/blogs/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Blog
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Blogs</CardTitle>
        </CardHeader>
        <CardContent>
          <BlogFilters />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No blogs found. Create your first blog!
                  </TableCell>
                </TableRow>
              ) : (
                blogs.map((blog) => (
                  <TableRow key={blog.id}>
                    <TableCell className="font-medium">{blog.title}</TableCell>
                    <TableCell className="text-gray-500">{blog.slug}</TableCell>
                    <TableCell>{blog.category || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={blog.published ? "default" : "secondary"}>
                        {blog.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>{blog.author?.name || blog.author?.email || "-"}</TableCell>
                    <TableCell>{format(new Date(blog.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/blogs/${blog.slug}`} target="_blank">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`${baseUrl}/blogs/${blog.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeleteBlogButton blogId={blog.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}