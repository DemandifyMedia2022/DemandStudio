"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, FileText, Upload } from "lucide-react"
import { CopyPromptButton } from "../copy-prompt-button"
import { DocsPager } from "@/components/docs-pager"

export default function ContentGuidePage() {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    const contentManagementPrompt = `# Agent Prompt: Content Management (Mutate & Assets)

**Role**: Senior Next.js Developer managing CMS Content.

**Objective**: Implement functionality to Create/Update content and Upload assets via API.

**Context**:
- **Mutate Endpoint**: \`/api/cms/mutate\` (POST) - Creates or Updates content based on \`_id\`.
- **Assets Endpoint**: \`/api/cms/assets\` (POST) - Uploads files (multipart/form-data).

**Step 1: Uploading Assets**
Implement an uploader function.

\`\`\`typescript
// lib/cms.ts
export async function uploadAsset(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/cms/assets', {
    method: 'POST',
    body: formData,
    // Note: Content-Type header is auto-set by browser for FormData
  });
  
  if (!res.ok) throw new Error('Upload failed');
  return res.json(); // Returns { _id, url, ... }
}
\`\`\`

**Step 2: Creating Content (Mutate)**
Implement a function to create a Blog post or any content item.

\`\`\`typescript
// lib/cms.ts
export async function createBlogPost(data: { title: string; content: string; image?: string }) {
  const payload = {
    _type: 'blog',
    title: data.title,
    slug: data.title.toLowerCase().replace(/ /g, '-'),
    content: data.content, // JSON string or HTML
    image: data.image,
    published: true
  };

  const res = await fetch('/api/cms/mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return res.json();
}
\`\`\`

**Execute:** Implement a form to upload an image and create a blog post using these functions.
`

    return (
        <div>
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Managing Content</h1>
                    <p className="text-muted-foreground">
                        How to create, update, and upload assets for your content via API.
                    </p>
                </div>
                <CopyPromptButton prompt={contentManagementPrompt} />
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Creating Posts & Blogs
                        </CardTitle>
                        <CardDescription>
                            Use the unified <code>/mutate</code> endpoint to create Posts and Blogs just like any other content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Badge variant="outline" className="mb-2">POST /api/cms/mutate</Badge>
                            <p className="text-sm text-muted-foreground mb-4">
                                The CMS automatically routes requests with <code>_type: 'post'</code> or <code>_type: 'blog'</code> to the correct tables.
                            </p>
                            <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                                {`// Create a Blog Post
{
  "_type": "blog",
  "title": "My New Integration",
  "slug": "my-new-integration",
  "content": "{\"root\": ...}", // Lexical JSON or HTML
  "excerpt": "Short summary...",
  "published": true,
  "image": "https://..."
}`}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Uploading Assets
                        </CardTitle>
                        <CardDescription>
                            Upload images or files to be used in your content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Badge variant="outline" className="mb-2">POST /api/cms/assets</Badge>
                            <p className="text-sm text-muted-foreground mb-4">
                                Send a <code>multipart/form-data</code> request with a <code>file</code> field.
                            </p>
                            <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                                {`// Example with JavaScript Fetch
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const res = await fetch('/api/cms/assets', {
  method: 'POST',
  headers: { 'x-api-key': '...' },
  body: formData
});

const asset = await res.json();
console.log(asset.url); // Use this URL in your content`}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                <DocsPager
                    prev={{
                        title: "Introduction",
                        href: "./" // Relative path back to main docs
                    }}
                    next={{
                        title: "Dynamic Content",
                        href: "content/dynamic"
                    }}
                />
            </div>
        </div>
    )
}
