import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { pool } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { DeleteContentItemButton } from "@/components/content-builder/delete-button"

export default async function ContentItemsPage(props: {
    params: Promise<{ orgSlug: string; projectSlug: string; typeSlug: string }>
}) {
    const params = await props.params;
    const { orgSlug, projectSlug, typeSlug } = params

    // Fetch Content Type
    const contentTypeResult = await pool.query(
        `SELECT ct.*, row_to_json(p.*) AS project
         FROM "ContentType" ct
         LEFT JOIN "Project" p ON p."id" = ct."projectId"
         WHERE ct."slug" = $1
         LIMIT 1`,
        [typeSlug]
    )
    const contentType = contentTypeResult.rows[0]

    if (contentType) {
        const fieldsResult = await pool.query(
            `SELECT * FROM "ContentField" WHERE "contentTypeId" = $1 ORDER BY "order" ASC`,
            [contentType.id]
        )
        contentType.fields = fieldsResult.rows
    }

    if (!contentType) {
        return notFound()
    }

    // Verify Project Match (Optional sanity check, though unique slug handles it)
    if (contentType.project?.slug !== projectSlug) {
        // Mismatch between URL project and content type owner
        return notFound()
    }

    // Fetch Items
    const itemsResult = await pool.query(
        `SELECT * FROM "ContentItem" WHERE "contentTypeId" = $1 ORDER BY "createdAt" DESC`,
        [contentType.id]
    )
    const items = itemsResult.rows

    const baseUrl = `/dashboard/${orgSlug}/projects/${projectSlug}/content/${typeSlug}`

    // Helper to extract a display title from the item data
    const getItemTitle = (item: any) => {
        try {
            const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data
            // Try to find common title-like fields or use the first text field
            const titleField = contentType.fields.find((f: any) => f.key === 'title' || f.key === 'name' || f.key === 'headline')
                || contentType.fields.find((f: any) => f.type === 'text')

            if (titleField && data[titleField.key]) {
                return data[titleField.key]
            }
            return item.id
        } catch (e) {
            return "Invalid Data"
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                {/* <Link href={`/dashboard/${orgSlug}/projects/${projectSlug}/builder`}>
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>*/}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight ">{contentType.name}</h1>
                    <p className="text-muted-foreground">
                        Manage {contentType.name} content items.
                    </p>
                </div>
                <Link href={`${baseUrl}/new`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New {contentType.name}
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All {contentType.name} Items</CardTitle>
                    <CardDescription>
                        Total {items.length} items found.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40%]">Title / Identifier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No items found. Create your first {contentType.name}!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                items.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {getItemTitle(item)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.published ? "default" : "secondary"}>
                                                {item.published ? "Published" : "Draft"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(item.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(item.updatedAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`${baseUrl}/${item.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <DeleteContentItemButton itemId={item.id} typeSlug={typeSlug} />
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

