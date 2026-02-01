import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Globe, Key, Book, Terminal } from "lucide-react"
import { CopyPromptButton } from "./copy-prompt-button"
import { DocsPager } from "@/components/docs-pager"

export default function ApiDocsPage() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

  const generalPrompt = `# Agent Prompt: Integrate Headless CMS

**Copy and paste the following prompt into your AI Agent (Cursor, Windsurf, etc.) in your new Next.js project:**

---

**Role**: You are a Senior Next.js Developer integrating a custom Headless CMS.

**Objective**: Connect the application to an external CMS running at \`http://localhost:3000/api/cms\` and build a Blog section (Listing + Detail view).

**Context**:
- The CMS uses a Unified API at \`/api/cms\`.
- We need to add a client SDK to fetch content.
- The content type for blogs is \`'blog'\`.
- Authentication is handled via an API Key (assume \`X-API-Key\` header if needed, or public read).

**Step 1: Create the CMS Client**
Create a new file \`lib/cms-client.ts\` with the following code. DO NOT change the logic, just paste it.

\`\`\`typescript
import { CmsDocument } from './types'; // You may need to generate this types file or use 'any' temporarily

export const CMS_FIELDS = {
  ID: '_id',
  TYPE: '_type',
  CREATED_AT: '_createdAt',
  UPDATED_AT: '_updatedAt', 
  REV: '_rev',
  DATASET: '_dataset',
  PROJECT_ID: '_projectId',
} as const;

export class CmsClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl?: string; apiKey?: string } = {}) {
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3000';
    this.apiKey = config.apiKey || process.env.CMS_API_KEY || '';
  }

  private async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const url = \`\${this.baseUrl}/api/cms/\${endpoint}\`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!res.ok) throw new Error(\`CMS API Error: \${res.statusText}\`);
    return res.json();
  }

  async fetch(type: string, options: { limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams();
    params.set('type', type);
    if (options.limit) params.set('limit', options.limit.toString());
    
    const data = await this.fetchAPI(\`query?\${params.toString()}\`, { next: { revalidate: 60 } });
    return data.result;
  }
}

export const cms = new CmsClient();
\`\`\`

**Step 2: Create Types**
Create \`lib/types.ts\`:
\`\`\`typescript
export interface BlogPost {
  _id: string;
  _type: 'blog';
  title: string;
  slug: string;
  excerpt?: string;
  content?: string; // JSON string from Lexical editor
  image?: string;
  published: boolean;
  _createdAt: string;
}
\`\`\`

**Step 3: Create Rich Text Renderer**
The CMS returns content as a serialized JSON string. Create \`components/rich-text-renderer.tsx\` to render it:

\`\`\`tsx
import React from 'react';

export function RichTextRenderer({ content }: { content?: string }) {
  if (!content) return null;

  let validJson;
  try {
    validJson = JSON.parse(content);
  } catch (e) {
    // Fallback if it's plain text or HTML string (legacy)
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  // Recursive renderer for Lexical JSON
  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;

    if (node.type === 'text') {
      let text = node.text;
      if (node.format & 1) text = <strong>{text}</strong>; // Bold
      if (node.format & 2) text = <em>{text}</em>;       // Italic
      if (node.format & 8) text = <u>{text}</u>;         // Underline
      return <span key={index}>{text}</span>;
    }

    if (node.type === 'link') {
      return (
        <a key={index} href={node.url} className="text-blue-600 underline" target={node.target || "_blank"} rel="noopener noreferrer">
          {node.children?.map((child: any, i: number) => renderNode(child, i))}
        </a>
      );
    }
  
    if (node.type === 'list') {
      const Tag = node.listType === 'number' ? 'ol' : 'ul';
      const className = node.listType === 'number' ? 'list-decimal' : 'list-disc';
      return (
        <Tag key={index} className={\`ml-5 \${className} my-4\`}>
             {node.children?.map((child: any, i: number) => renderNode(child, i))}
        </Tag>
      );
    }
    
    if (node.type === 'listitem') {
      return <li key={index}>{node.children?.map((child: any, i: number) => renderNode(child, i))}</li>;
    }

    if (node.type === 'heading') {
      const Tag = (node.tag as keyof JSX.IntrinsicElements) || 'h1';
      const sizes: Record<string, string> = { h1: 'text-4xl', h2: 'text-3xl', h3: 'text-2xl', h4: 'text-xl' };
      return (
        <Tag key={index} className={\`font-bold my-4 \${sizes[node.tag] || ''}\`}>
          {node.children?.map((child: any, i: number) => renderNode(child, i))}
        </Tag>
      );
    }

    if (node.type === 'paragraph') {
      return (
        <p key={index} className="mb-4 leading-relaxed">
          {node.children?.map((child: any, i: number) => renderNode(child, i))}
        </p>
      );
    }

    // Default: render children
    return (
      <div key={index}>
        {node.children?.map((child: any, i: number) => renderNode(child, i))}
      </div>
    );
  };

  return <div className="prose max-w-none">{renderNode(validJson.root, 0)}</div>;
}
\`\`\`

**Step 4: Build the Blog Pages**
1.  **Listing Page**: Create \`app/blog/page.tsx\`.
    -   Use \`cms.fetch('blog')\` to get posts.
    -   Display them in a responsive grid.
2.  **Detail Page**: Create \`app/blog/[slug]/page.tsx\`.
    -   Fetch list, find by slug.
    -   **Usage**: \`<RichTextRenderer content={post.content} />\` to render the body.

**Configuration**:
- Ensure \`next.config.ts\` allows images from \`localhost\` if the CMS serves images.

**Execute these steps now.**
`

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Headless CMS API</h1>
          <p className="text-muted-foreground">
            Integrate your content into any application using our Unified CMS API.
          </p>
        </div>
        <CopyPromptButton prompt={generalPrompt} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="text-lg">{baseUrl}/api/cms</code>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Authentication
            </CardTitle>
            <CardDescription>
              All CMS write operations require an API Key. Read operations are public if configured, or protected via key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Using API Key (Recommended)</p>
              <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                {`// Header method
X-API-Key: your-api-key-here`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Client SDK (Recommended)
            </CardTitle>
            <CardDescription>
              Copy this client into your project to interact with the CMS easily.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Create a file <code>lib/cms-client.ts</code> in your project:
              </p>
              <div className="max-h-64 overflow-y-auto bg-gray-100 dark:bg-muted p-4 rounded text-xs border">
                <pre>{`import { CmsDocument } from './types'; // Define types as needed

export class CmsClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  private async fetchAPI(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(\`\${this.baseUrl}/api/cms/\${endpoint}\`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...options.headers,
      },
    });

    if (!res.ok) throw new Error(\`CMS API Error: \${res.statusText}\`);
    return res.json();
  }

  async fetch(type: string, options: { limit?: number; offset?: number } = {}) {
    const params = new URLSearchParams({ type, ...options });
    const data = await this.fetchAPI(\`query?\${params.toString()}\`);
    return data.result;
  }
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Rich Text Rendering
            </CardTitle>
            <CardDescription>
              Content is returned as serialized JSON (Lexical). Use this React component to render it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Create <code>components/rich-text-renderer.tsx</code>:
              </p>
              <div className="max-h-64 overflow-y-auto bg-gray-100 dark:bg-muted p-4 rounded text-xs border">
                <pre>{`import React from 'react';

export function RichTextRenderer({ content }: { content?: string }) {
  if (!content) return null;

  let validJson;
  try {
    validJson = JSON.parse(content);
  } catch (e) {
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    if (!node) return null;
    if (node.type === 'text') {
      let text = node.text;
      if (node.format & 1) text = <strong>{text}</strong>;
      if (node.format & 2) text = <em>{text}</em>;
      if (node.format & 8) text = <u>{text}</u>;
      return <span key={index}>{text}</span>;
    }
    if (node.type === 'paragraph') {
      return <p key={index} className="mb-4">{node.children?.map((c: any, i: number) => renderNode(c, i))}</p>;
    }
    if (node.type === 'heading') {
      const Tag = node.tag as keyof JSX.IntrinsicElements;
      return <Tag key={index} className="font-bold my-4 text-xl">{node.children?.map((c: any, i: number) => renderNode(c, i))}</Tag>;
    }
    return <div key={index}>{node.children?.map((c: any, i: number) => renderNode(c, i))}</div>;
  };

  return <div className="prose max-w-none">{renderNode(validJson.root, 0)}</div>;
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* GET Query */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">GET</Badge>
                <code className="text-lg">/query</code>
              </div>
              <p className="text-muted-foreground mb-2">Fetch any content type (Post, Blog, etc.) as a unified document.</p>
              <div className="mb-2">
                <p className="font-medium text-sm mb-1">Query Parameters:</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><code>type</code> - Content Type Slug (e.g., 'post', 'blog', 'product')</li>
                  <li><code>limit</code> - Number of results (default: 10)</li>
                  <li><code>offset</code> - Pagination offset</li>
                </ul>
              </div>
              <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                {`// Request
GET /api/cms/query?type=post&limit=5

// Response
{
  "result": [
    {
      "_id": "ck...",
      "_type": "post",
      "title": "My Post",
      "slug": "my-post",
      ...
    }
  ]
}`}
              </pre>
            </div>

            {/* POST Mutate */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">POST</Badge>
                <code className="text-lg">/mutate</code>
              </div>
              <p className="text-muted-foreground mb-2">Create or update content. Validates against schema.</p>
              <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                {`// Request
POST /api/cms/mutate
{
  "_type": "blog",
  "title": "New Blog Post",
  "slug": "new-blog-post",
  "content": "Hello world..."
}

// Response
{
  "transactionId": "...",
  "results": [ { "id": "...", "operation": "create" } ]
}`}
              </pre>
            </div>

            {/* POST Assets */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">POST</Badge>
                <code className="text-lg">/assets</code>
              </div>
              <p className="text-muted-foreground mb-2">Upload images or files.</p>
              <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                {`// Request (Multipart Form Data)
file: (binary)

// Response
{
  "_id": "image-123...",
  "_type": "cms.imageAsset",
  "url": "/uploads/..."
}`}
              </pre>
            </div>

          </CardContent>
        </Card>


        <DocsPager
          next={{
            title: "Managing Content",
            href: "api-docs/content"
          }}
        />
      </div>
    </div >
  )
}
