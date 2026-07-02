
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Editor } from "@/components/blocks/editor-x/editor"

// Helper component for time picking to handle local state and prevent jumping values
const TimePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [hh, setHh] = useState("")
    const [mm, setMm] = useState("")
    const [period, setPeriod] = useState("AM")

    // Sync local state when external value changes (e.g. on load)
    // BUT avoid syncing if the change was just triggered by us to prevent cursor jumps/fighting
    useEffect(() => {
        if (value && typeof value === 'string') {
            const hStr = hh.padStart(2, "0")
            const mStr = mm.padStart(2, "0")
            const currentFormatted = `${hStr}:${mStr} ${period}`
            
            if (value !== currentFormatted) {
                const match = value.match(/^(\d{1,2}):(\d{2})\s(AM|PM)$/i);
                if (match) {
                    setHh(match[1]);
                    setMm(match[2]);
                    setPeriod(match[3].toUpperCase());
                }
            }
        } else if (!value) {
            setHh("")
            setMm("")
            setPeriod("AM")
        }
    }, [value])

    const handleSync = (newHh: string, newMm: string, newPeriod: string) => {
        setHh(newHh)
        setMm(newMm)
        setPeriod(newPeriod)

        // Only sync to parent if we have valid-ish numbers or if both empty
        if (!newHh && !newMm) {
            onChange("")
            return
        }

        // Pad for storage
        const h = newHh.padStart(2, "0")
        const m = (newMm || "00").padStart(2, "0")
        onChange(`${h}:${m} ${newPeriod}`)
    }

    return (
        <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Hour</Label>
                <Input
                    className="w-16 text-center"
                    placeholder="12"
                    maxLength={2}
                    value={hh}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val !== "" && (parseInt(val) > 12 || val === "0" || val === "00")) val = "12";
                        handleSync(val, mm, period)
                    }}
                />
            </div>
            <span className="text-xl font-bold text-muted-foreground mt-4">:</span>
            <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Min</Label>
                <Input
                    className="w-16 text-center"
                    placeholder="00"
                    maxLength={2}
                    value={mm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val !== "" && parseInt(val) > 59) val = "59";
                        handleSync(hh, val, period)
                    }}
                />
            </div>
            <div className="flex flex-col gap-1">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Period</Label>
                <Select
                    value={period}
                    onValueChange={(val: string) => handleSync(hh, mm, val)}
                >
                    <SelectTrigger className="w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="AM">AM</SelectItem>
                        <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

const renderVideoPreview = (url: any) => {
    if (!url || typeof url !== 'string') return null;
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isVimeo = url.includes("vimeo.com");
    if (isYoutube) {
        const videoId = url.includes("v=")? url.split("v=")[1].split("&")[0] : url.split("/").pop();
        return <iframe className="mt-2 w-full aspect-video rounded-md" src={`https://www.youtube.com/embed/${videoId}`} allowFullScreen></iframe>
    }
    if (isVimeo) {
        const videoId = url.split("/").pop();
        return <iframe className="mt-2 w-full aspect-video rounded-md" src={`https://player.vimeo.com/video/${videoId}`} allowFullScreen></iframe>
    }
    return <video className="mt-2 w-full aspect-video rounded-md" src={url} controls></video>
}

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
        const value = formData?.[field?.key] ?? ""

        switch (field.type) {
            case "text":
                return (
                    <Input
                        id={field.key}
                        value={value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.key, e.target.value)}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.key, parseFloat(e.target.value))}
                        placeholder={`Enter ${field.name}`}
                        required={field.required}
                    />
                )
            case "rich-text":
                let editorStateObj = value;
                if (typeof value === 'string' && value) {
                    try {
                        editorStateObj = JSON.parse(value);
                    } catch (e) {
                        editorStateObj = undefined;
                    }
                }
                return (
                    <div className="w-full">
                        <Editor
                            editorSerializedState={typeof editorStateObj === 'object' && editorStateObj ? editorStateObj : undefined}
                            onSerializedChange={(state: any) => handleChange(field.key, state)}
                            editable={true}
                        />
                    </div>
                )
            case "boolean":
            case "yes-no":
                const isYes = !!value;
                return (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleChange(field.key, true)}
                            className={`px-6 py-2 rounded-md border text-sm font-medium transition-colors ${
                                isYes
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-foreground border-input hover:bg-muted"
                            }`}
                        >
                            Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => handleChange(field.key, false)}
                            className={`px-6 py-2 rounded-md border text-sm font-medium transition-colors ${
                                !isYes && value !== "" && value !== undefined
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-foreground border-input hover:bg-muted"
                            }`}
                        >
                            No
                        </button>
                    </div>
                )
            case "date":
                // Safely handle date string to prevent timezone shifts
                let dateValue = "";
                try {
                    if (value) {
                        if (typeof value === 'string' && value.includes('T')) {
                            dateValue = value.split('T')[0];
                        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                            dateValue = value;
                        } else {
                            const d = new Date(value);
                            if (!isNaN(d.getTime())) {
                                dateValue = d.toISOString().split('T')[0];
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error parsing date value:", e);
                }
                return (
                    <Input
                        id={field.key}
                        type="date"
                        value={dateValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.key, e.target.value)} // Stored as YYYY-MM-DD string
                        required={field.required}
                    />
                )
            case "image":
                return (
                    <ImageUploader
                        value={value}
                        onChange={(url: string) => handleChange(field.key, url)}
                    />
                )
            case "file":
                return (
                    <FileUploader
                        value={value}
                        onChange={(url: string) => handleChange(field.key, url)}
                    />
                )
            case "video":
                return (
                    <div className="space-y-2">
                        <Input
                            id={field.key}
                            type="url"
                            value={value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(field.key, e.target.value)}
                            placeholder={`Enter Video URL (YouTube, Vimeo, etc.)`}
                            required={field.required}
                        />
                        {value && renderVideoPreview(value)}
                    </div>
                )
            case "time": {
                return <TimePicker value={value} onChange={(val: string) => handleChange(field.key, val)} />
            }
            case "select": {
                const options = (field?.options || "").split(',').map((o: string) => o.trim()).filter(Boolean);
                const isMulti = field?.multiple === true;
                const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);

                return (
                    <div className="flex flex-wrap gap-2">
                        {options.map((opt: string) => {
                            const isSelected = isMulti ? selectedValues.includes(opt) : value === opt;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        if (isMulti) {
                                            const newVals = isSelected
                                                ? selectedValues.filter((v: string) => v !== opt)
                                                : [...selectedValues, opt];
                                            handleChange(field.key, newVals);
                                        } else {
                                            handleChange(field.key, isSelected ? "" : opt);
                                        }
                                    }}
                                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-background text-muted-foreground border-input hover:bg-muted hover:text-foreground"
                                    }`}
                                >
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                )
            }
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
    const sortedFields = Array.isArray(contentType?.fields) 
        ? [...contentType.fields].sort((a, b) => (a?.order || 0) - (b?.order || 0))
        : []

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
                    <div className="text-sm font-medium px-3 py-1.5 rounded-md border bg-muted">
                        Status: <span className={published ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                            {published ? "Published" : "Draft"}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            disabled={isSubmitting}
                            onClick={() => {
                                setPublished(false)
                                onSubmit(formData, false)
                            }}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting && !published ? "Saving..." : "Save as Draft"}
                        </Button>
                        <Button 
                            type="button" 
                            disabled={isSubmitting}
                            onClick={() => {
                                setPublished(true)
                                onSubmit(formData, true)
                            }}
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting && published ? "Publishing..." : "Publish"}
                        </Button>
                    </div>
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
