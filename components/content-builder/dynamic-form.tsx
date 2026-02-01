
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Save, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUploader } from "@/components/ui/image-uploader"
import { FileUploader } from "@/components/ui/file-uploader"
import { toast } from "sonner"

interface ContentType {
    id: string
    name: string
    slug: string
    fields: any[]
}

interface DynamicContentFormProps {
    contentType: ContentType
    initialData?: any
    initialPublished?: boolean
    onSubmit: (data: any, published: boolean) => Promise<void>
    isSubmitting?: boolean
}

export function DynamicContentForm({
    contentType,
    initialData = {},
    initialPublished = false,
    onSubmit,
    isSubmitting = false
}: DynamicContentFormProps) {
    const router = useRouter()
    const [formData, setFormData] = useState<any>(initialData)
    const [published, setPublished] = useState(initialPublished)

    const handleChange = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit(formData, published)
    }

    const renderField = (field: any) => {
        const value = formData[field.key] ?? ""

        switch (field.type) {
            case "text":
                return (
                    <Input
                        id={field.key}
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.name}`}
                        required={field.required}
                    />
                )
            case "number":
                return (
                    <Input
                        id={field.key}
                        type="number"
                        value={value}
                        onChange={(e) => handleChange(field.key, parseFloat(e.target.value))}
                        placeholder={`Enter ${field.name}`}
                        required={field.required}
                    />
                )
            case "rich-text":
                return (
                    <Textarea
                        id={field.key}
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={`Enter ${field.name}`}
                        required={field.required}
                        className="min-h-[200px]"
                    />
                )
            case "boolean":
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={field.key}
                            checked={!!value}
                            onCheckedChange={(checked) => handleChange(field.key, checked)}
                        />
                        <Label htmlFor={field.key} className="font-normal cursor-pointer">
                            {value ? "Yes" : "No"}
                        </Label>
                    </div>
                )
            case "date":
                return (
                    <Input
                        id={field.key}
                        type="date"
                        // Ensure value is YYYY-MM-DD
                        value={value ? new Date(value).toISOString().split('T')[0] : ""}
                        onChange={(e) => handleChange(field.key, e.target.value)} // Stored as string date
                        required={field.required}
                    />
                )
            case "image":
                return (
                    <ImageUploader
                        value={value}
                        onChange={(url) => handleChange(field.key, url)}
                    />
                )
            case "file":
                return (
                    <FileUploader
                        value={value}
                        onChange={(url) => handleChange(field.key, url)}
                    />
                )
            default:
                return (
                    <Input
                        id={field.key}
                        value={value}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                )
        }
    }

    // Sort fields by order
    const sortedFields = [...contentType.fields].sort((a, b) => a.order - b.order)

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between items-center">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2 bg-muted px-3 py-1.5 rounded-md">
                        <Switch
                            id="published-status"
                            checked={published}
                            onCheckedChange={setPublished}
                        />
                        <Label htmlFor="published-status" className="cursor-pointer">
                            {published ? "Published" : "Draft"}
                        </Label>
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? "Saving..." : "Save Content"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 grid-cols-1">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>{contentType.name} Data</CardTitle>
                        <CardDescription>
                            Fill in the details below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {sortedFields.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <Label htmlFor={field.key}>
                                    {field.name}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                {renderField(field)}
                            </div>
                        ))}
                        {sortedFields.length === 0 && (
                            <p className="text-muted-foreground text-center py-4">
                                This content type has no fields defined. Please add fields in the Schema Builder.
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </form>
    )
}
