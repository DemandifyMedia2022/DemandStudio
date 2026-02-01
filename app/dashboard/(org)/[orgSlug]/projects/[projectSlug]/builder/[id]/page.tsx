
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Plus, Trash2, ArrowLeft, GripVertical, Save, Pencil, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface ContentField {
    id: string
    name: string
    key: string
    type: string
    required: boolean
    options?: any
    order: number
}

interface ContentType {
    id: string
    name: string
    slug: string
    description?: string
    fields: ContentField[]
}

const FIELD_TYPES = [
    { value: "text", label: "Text (Single line)" },
    { value: "rich-text", label: "Rich Text (Editor)" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "boolean", label: "Boolean (Switch)" },
    { value: "image", label: "Image" },
    { value: "file", label: "File / Document" },
]

// Sortable Item Component
function SortableFieldItem({ field, onEdit, onDelete, FIELD_TYPES }: { field: ContentField; onEdit: (f: ContentField) => void; onDelete: (id: string) => void, FIELD_TYPES: any[] }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id })

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="flex items-center gap-3 p-3 border rounded-lg bg-background shadow-sm hover:shadow-md hover:border-primary/20 transition-all group relative"
        >
            <div className="cursor-grab hover:cursor-grabbing text-muted-foreground/50 hover:text-primary outline-none p-1 rounded hover:bg-primary/5 touch-none transition-colors" {...listeners}>
                <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <div className="font-medium flex items-center gap-2 text-foreground">
                    {field.name}
                    {field.required && <span className="text-[10px] uppercase font-bold bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full tracking-wider">Required</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{field.key}</span>
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                    </span>
                </div>
            </div>
            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/10" onClick={() => onEdit(field)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(field.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

export default function ContentTypeEditorPage() {
    const router = useRouter()
    const params = useParams()
    const id = params?.id as string
    const orgSlug = params?.orgSlug as string
    const projectSlug = params?.projectSlug as string

    // Construct the back URL (List page)
    const backUrl = `/dashboard/${orgSlug}/projects/${projectSlug}/builder`

    const [contentType, setContentType] = useState<ContentType | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Field Dialog State
    const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false)
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null)






    const [currentField, setCurrentField] = useState<Partial<ContentField>>({
        name: "",
        key: "",
        type: "text",
        required: false
    })

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts prevents accidental clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id && contentType) {
            setContentType((prev) => {
                if (!prev) return null;
                const oldIndex = prev.fields.findIndex((f) => f.id === active.id)
                const newIndex = prev.fields.findIndex((f) => f.id === over?.id)

                const newFields = arrayMove(prev.fields, oldIndex, newIndex).map((f, i) => ({
                    ...f,
                    order: i
                }))

                return {
                    ...prev,
                    fields: newFields
                }
            })
        }
    }

    useEffect(() => {
        if (id) fetchContentType(id)
    }, [id])

    const fetchContentType = async (typeId: string) => {
        try {
            const res = await fetch(`/api/content-types/${typeId}`)
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            // Ensure fields is array
            data.fields = data.fields || []
            setContentType(data)
        } catch (error) {
            toast.error("Failed to load content type")
            router.push(backUrl)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCopySchema = async () => {
        if (!contentType) return

        const schema = generateTypeScriptSchema(contentType)
        await navigator.clipboard.writeText(schema)
        toast.success("TypeScript schema copied to clipboard")
    }

    const generateTypeScriptSchema = (type: ContentType) => {
        const typeName = type.name.replace(/[^a-zA-Z0-9]/g, '')

        let schema = `export interface ${typeName} {\n`
        schema += `  _id: string;\n`
        schema += `  _type: '${type.slug}';\n`
        schema += `  _createdAt: string;\n`
        schema += `  _updatedAt: string;\n`

        type.fields.forEach(field => {
            let tsType = 'string'
            if (field.type === 'number') tsType = 'number'
            if (field.type === 'boolean') tsType = 'boolean'
            // date, image, file, rich-text are all strings (or objects, but usually string URLs/JSON) in this simplified CMS

            const optional = field.required ? '' : '?'
            schema += `  ${field.key}${optional}: ${tsType};\n`
        })

        schema += `}`
        return schema
    }

    const handleSave = async () => {
        if (!contentType) return
        setIsSaving(true)

        try {
            const res = await fetch(`/api/content-types/${contentType.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contentType),
            })

            if (!res.ok) throw new Error("Failed to save")

            const updated = await res.json()
            setContentType(updated)
            toast.success("Schema saved successfully")
            router.push(backUrl) // Redirect on success
        } catch (error) {
            toast.error("Failed to save schema")
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddField = () => {
        if (!currentField.name || !currentField.key) {
            toast.error("Name and Key are required")
            return
        }

        if (!contentType) return

        const newField: ContentField = {
            id: editingFieldId || `temp-${Date.now()}`,
            name: currentField.name,
            key: currentField.key,
            type: currentField.type || "text",
            required: currentField.required || false,
            order: editingFieldId
                ? contentType.fields.find(f => f.id === editingFieldId)?.order ?? 0
                : contentType.fields.length,
            options: null
        }

        if (editingFieldId) {
            setContentType({
                ...contentType,
                fields: contentType.fields.map(f => f.id === editingFieldId ? newField : f)
            })
        } else {
            setContentType({
                ...contentType,
                fields: [...contentType.fields, newField]
            })
        }

        setIsFieldDialogOpen(false)
        resetFieldForm()
    }

    const resetFieldForm = () => {
        setEditingFieldId(null)
        setCurrentField({ name: "", key: "", type: "text", required: false })
    }

    // Auto-generate key from name
    const handleFieldNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value
        // Only auto-generate key if we are creating new and key hasn't been manually edited (simple heuristic: empty or matches previous slug)
        // For simplicity, just auto-gen if key is empty or we are editing name
        if (!editingFieldId) {
            const key = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "")

            setCurrentField(prev => ({ ...prev, name, key }))
        } else {
            setCurrentField(prev => ({ ...prev, name }))
        }
    }

    const handleDeleteField = (fieldId: string) => {
        if (!contentType) return
        setContentType({
            ...contentType,
            fields: contentType.fields.filter(f => f.id !== fieldId)
        })
    }

    const openEditField = (field: ContentField) => {
        setEditingFieldId(field.id)
        setCurrentField(field)
        setIsFieldDialogOpen(true)
    }

    if (isLoading) return <div className="p-8">Loading...</div>
    if (!contentType) return <div className="p-8">Content type not found</div>

    return (
        <div className="p-8 space-y-8 w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push(backUrl)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">{contentType.name} Schema</h1>
                    <p className="text-muted-foreground">
                        Manage fields for {contentType.name}.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleCopySchema}>
                        <Code className="mr-2 h-4 w-4" />
                        Copy Schema
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Schema"}
                    </Button>
                </div>
            </div>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
                {/* Main Settings */}
                <Card className="md:col-span-1 h-fit shadow-md border-muted/60 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b pb-4">
                        <CardTitle className="text-lg">Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-2">
                            <Label htmlFor="typeName" className="text-foreground/80">Name</Label>
                            <Input
                                id="typeName"
                                value={contentType.name}
                                onChange={(e) => setContentType({ ...contentType, name: e.target.value })}
                                className="bg-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="typeDescription" className="text-foreground/80">Description</Label>
                            <Input
                                id="typeDescription"
                                value={contentType.description || ""}
                                onChange={(e) => setContentType({ ...contentType, description: e.target.value })}
                                className="bg-background"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-foreground/80">Slug</Label>
                            <Input value={contentType.slug} disabled className="bg-muted/50 font-mono text-sm" />
                            <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Fields Editor */}
                <Card className="md:col-span-2 shadow-md border-muted/60 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b pb-4">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Fields</CardTitle>
                            <CardDescription>Define the structure of your content.</CardDescription>
                        </div>
                        <Button size="sm" onClick={() => { resetFieldForm(); setIsFieldDialogOpen(true); }} className="shadow-none">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Field
                        </Button>
                    </CardHeader>
                    <CardContent className="pt-6 bg-muted/5 min-h-[400px]">
                        {contentType.fields?.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-background/50">
                                <p className="text-muted-foreground mb-4">No fields defined yet.</p>
                                <Button variant="secondary" onClick={() => setIsFieldDialogOpen(true)}>
                                    Add your first field
                                </Button>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={contentType.fields.map(f => f.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {contentType.fields.map((field) => (
                                            <SortableFieldItem
                                                key={field.id}
                                                field={field}
                                                onEdit={openEditField}
                                                onDelete={handleDeleteField}
                                                FIELD_TYPES={FIELD_TYPES}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Field Dialog */}
            <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFieldId ? "Edit Field" : "Add New Field"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fieldName">Field Name</Label>
                            <Input
                                id="fieldName"
                                value={currentField.name}
                                onChange={handleFieldNameChange}
                                placeholder="e.g. Hero Image"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fieldKey">Field Key (API ID)</Label>
                            <Input
                                id="fieldKey"
                                value={currentField.key}
                                onChange={(e) => setCurrentField({ ...currentField, key: e.target.value })}
                                placeholder="e.g. heroImage"
                                className="font-mono"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="fieldType">Field Type</Label>
                            <Select
                                value={currentField.type}
                                onValueChange={(val) => setCurrentField({ ...currentField, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Switch
                                id="fieldRequired"
                                checked={currentField.required}
                                onCheckedChange={(checked) => setCurrentField({ ...currentField, required: checked })}
                            />
                            <Label htmlFor="fieldRequired" className="font-normal cursor-pointer">
                                Required field
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleAddField}>
                            {editingFieldId ? "Update Field" : "Add Field"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
