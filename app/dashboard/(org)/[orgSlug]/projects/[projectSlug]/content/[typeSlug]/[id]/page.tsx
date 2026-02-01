"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DynamicContentForm } from "@/components/content-builder/dynamic-form"
import { toast } from "sonner"

interface ContentType {
    id: string
    name: string
    slug: string
    fields: any[]
}

export default function EditContentItemPage() {
    const params = useParams()
    const router = useRouter()
    const { orgSlug, projectSlug, typeSlug, id } = params as { orgSlug: string, projectSlug: string, typeSlug: string, id: string }

    const [contentType, setContentType] = useState<ContentType | null>(null)
    const [initialData, setInitialData] = useState<any>(null)
    const [published, setPublished] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (id && typeSlug) fetchData()
    }, [id, typeSlug])

    const fetchData = async () => {
        try {
            // Fetch Item
            const itemRes = await fetch(`/api/content-items/${id}`)
            if (!itemRes.ok) throw new Error("Failed to fetch item")
            const item = await itemRes.json()

            // Define Content Type from Item or fetch separately
            // The item response likely includes the content type if expected, 
            // but relying on the typeSlug from URL to fetch the *schema* is safer if item doesn't embed it fully.
            // However, item.contentType is typically included.

            let type = item.contentType

            // If item response provides minimal Type, fetch full Type schema
            if (!type || !type.fields) {
                const typeRes = await fetch(`/api/content-types/${item.contentTypeId}`)
                if (typeRes.ok) {
                    type = await typeRes.json()
                }
            }

            setContentType(type)
            setInitialData(JSON.parse(item.data))
            setPublished(item.published)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load content")
            router.push(`/dashboard/${orgSlug}/projects/${projectSlug}/content/${typeSlug}`)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (data: any, isPublished: boolean) => {
        try {
            const res = await fetch(`/api/content-items/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data: JSON.stringify(data),
                    published: isPublished
                })
            })

            if (!res.ok) throw new Error("Failed to update content")

            toast.success("Content item updated successfully")
            router.push(`/dashboard/${orgSlug}/projects/${projectSlug}/content/${typeSlug}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to update content item")
        }
    }

    if (isLoading) return <div className="p-8">Loading...</div>
    if (!contentType) return <div className="p-8">Content type not found</div>

    return (
        <div className="w-full py-8">
            <div className="mb-8 ml-4">
                <h1 className="text-3xl font-bold">Edit {contentType.name}</h1>
                <p className="text-muted-foreground">Update this {contentType.name} item.</p>
            </div>

            <DynamicContentForm
                contentType={contentType}
                initialData={initialData}
                initialPublished={published}
                onSubmit={handleSubmit}
            />
        </div>
    )
}
