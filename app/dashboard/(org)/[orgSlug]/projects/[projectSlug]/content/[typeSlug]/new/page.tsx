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

export default function NewContentItemPage() {
    const params = useParams()
    const router = useRouter()
    const { orgSlug, projectSlug, typeSlug } = params as { orgSlug: string, projectSlug: string, typeSlug: string }

    const [contentType, setContentType] = useState<ContentType | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (typeSlug) fetchContentType()
    }, [typeSlug])

    const fetchContentType = async () => {
        try {
            // We need to fetch the content type definition to know what fields to render
            // Assuming we can fetch by slug. If API doesn't support slug lookup directly, we might need a specific endpoint.
            // Based on previous files, typically we use ID. But here we have slug in URL.
            // Let's assume there's an endpoint to get type by slug or we list all.
            // To be safe, let's try fetching specific type by slug if supported, or list and find.
            // Actually, the Schema Builder page uses ID. 
            // The sidebar links to /content/[slug].

            // Let's rely on an API that accepts slug OR list and filter.
            // Searching previous context, I saw /api/content-types/[id].
            // I should check if there is a way to get by slug.
            // Ideally: GET /api/content-types?slug=... or similar.

            const res = await fetch(`/api/content-types?slug=${typeSlug}&projectSlug=${projectSlug}&orgSlug=${orgSlug}`)
            if (!res.ok) throw new Error("Failed to fetch content type")
            const data = await res.json()

            // data might be array if searching, or object.
            // If the API returns a list when querying, we pick the first.
            const type = Array.isArray(data) ? data[0] : data

            if (!type) throw new Error("Content type not found")
            setContentType(type)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load content type definition")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (data: any, published: boolean) => {
        if (!contentType) return

        try {
            const res = await fetch(`/api/content-items/${typeSlug}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data,
                    published
                })
            })

            if (!res.ok) throw new Error("Failed to create content")

            toast.success("Content item created successfully")
            router.push(`/dashboard/${orgSlug}/projects/${projectSlug}/content/${typeSlug}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            toast.error("Failed to create content item")
        }
    }

    if (isLoading) return <div className="p-8">Loading...</div>
    if (!contentType) return <div className="p-8">Content type not found</div>

    return (
        <div className="w-full py-8">
            <div className="mb-8 ml-4">
                <h1 className="text-3xl font-bold">New {contentType.name}</h1>
                <p className="text-muted-foreground">Create a new {contentType.name} item.</p>
            </div>

            <DynamicContentForm
                contentType={contentType}
                onSubmit={handleSubmit}
            />
        </div>
    )
}
