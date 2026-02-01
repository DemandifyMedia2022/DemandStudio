"use client"

import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner" // Assuming you have sonner or some toast library, if not we'll use a simple alert or just icon change

export function CopyPromptButton({ prompt }: { prompt: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        await navigator.clipboard.writeText(prompt)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        // Optional: toast.success("Prompt copied to clipboard!")
    }

    return (
        <Button
            variant="outline"
            onClick={handleCopy}
            className="gap-2"
        >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy Prompt"}
        </Button>
    )
}
