
import Link from "next/link"
import { pool } from "@/lib/db"
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
import { Plus, Pencil } from "lucide-react"
import { format } from "date-fns"
import { DeletePostButton } from "@/components/posts/delete-button"
import { notFound } from "next/navigation"

export default async function ProjectPostsPage(props: {
    params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
    const params = await props.params;

    // Fetch project to get ID
    const projectResult = await pool.query(
        `SELECT p."id", p."name"
         FROM "Project" p
         INNER JOIN "Organization" o ON o."id" = p."organizationId"
         WHERE p."slug" = $1 AND o."slug" = $2
         LIMIT 1`,
        [params.projectSlug, params.orgSlug]
    )
    const project = projectResult.rows[0]

    if (!project) {
        notFound();
    }

    const { rows: posts } = await pool.query(
        `SELECT p.*,
          CASE WHEN u."id" IS NULL THEN NULL ELSE json_build_object('name', u."name", 'email', u."email") END AS author
         FROM "Post" p
         LEFT JOIN "User" u ON u."id" = p."authorId"
         WHERE p."projectId" = $1
         ORDER BY p."createdAt" DESC`,
        [project.id]
    )

    const baseUrl = `/dashboard/${params.orgSlug}/projects/${params.projectSlug}`

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Posts</h1>
                <Link href={`${baseUrl}/posts/new`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Post
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Posts for {project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-gray-500">
                                        No posts found for this project. Create your first post!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post.id}>
                                        <TableCell className="font-medium">{post.title}</TableCell>
                                        <TableCell className="text-gray-500">{post.slug}</TableCell>
                                        <TableCell>
                                            <Badge variant={post.published ? "default" : "secondary"}>
                                                {post.published ? "Published" : "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{post.author.name || post.author.email}</TableCell>
                                        <TableCell>
                                            {format(new Date(post.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`${baseUrl}/posts/${post.id}/edit`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {/* Delete button uses API, currently stateless regarding project but safe if user owns it */}
                                                <DeletePostButton postId={post.id} />
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
