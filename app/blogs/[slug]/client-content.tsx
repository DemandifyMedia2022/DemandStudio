"use client"

import { Editor } from "@/components/blocks/editor-x/editor"

export function ClientSideContent({ content }: { content: string }) {
    let parsedContent = undefined
    try {
        if (content && typeof content === 'string' && content.trim().startsWith("{")) {
            parsedContent = JSON.parse(content)
        } else if (content && typeof content === 'object') {
            parsedContent = content;
        }
    } catch (e) {
        console.error("Failed to parse content", e)
    }

    if (!parsedContent) {
        // Fallback for plain text or empty
        return <div className="whitespace-pre-wrap">{content}</div>
    }

    return (
        <div className="relative pointer-events-none">
            {/* pointer-events-none to basic read-only feel, though Editor has readOnly prop we should use if exposed */}
            <Editor
                editorSerializedState={parsedContent}
                editable={false}
            />
        </div>
    )
}
