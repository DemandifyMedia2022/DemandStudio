"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Layers, Cuboid } from "lucide-react"
import { CopyPromptButton } from "../../copy-prompt-button"
import { DocsPager } from "@/components/docs-pager"

export default function DynamicContentGuidePage() {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"

    const dynamicContentPrompt = `# Agent Prompt: Dynamic Content Integration

**Role**: Senior Next.js Developer using Headless CMS Dynamic Schemas.

**Objective**: Integrate "Dynamic Content" (custom schemas) from the CMS into the application.

**Context**:
- We have defined a custom Content Type in the dashboard (e.g., 'product', 'testimonial', 'event').
- API Endpoint: \`/api/cms/query\` (read) and \`/api/cms/mutate\` (write).

**Step 1: Fetching Dynamic Content**
Use the CMS Client (from previous steps or create basics) to fetch a specific type.

\`\`\`typescript
// lib/cms.ts
import { cms } from './cms-client'; // Assume client exists

export async function getProducts() {
  // 'product' is the slug defined in Content Builder
  return await cms.fetch('product', { limit: 20 });
}
\`\`\`

**Step 2: Type Definitions**
Since content is dynamic, define an interface matching your Schema fields.

\`\`\`typescript
// lib/types.ts
export interface Product {
  _id: string;
  _type: 'product';
  name: string;      // Defined in Schema
  price: number;     // Defined in Schema
  description?: string;
  image?: string;
}
\`\`\`

**Step 3: Rendering Page**
Create a page to list these items.

\`\`\`tsx
// app/products/page.tsx
import { getProducts } from '@/lib/cms';

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {products.map((p: any) => (
         <div key={p._id} className="border p-4 rounded-lg">
           <h2 className="font-bold text-xl">{p.name}</h2>
           <p className="text-green-600">\${p.price}</p>
         </div>
      ))}
    </div>
  );
}
\`\`\`

**Execute:** Implement the fetching and rendering logic for a sample dynamic type (e.g., 'product').
`

    return (
        <div>
            <div className="mb-6 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Dynamic Content</h1>
                    <p className="text-muted-foreground">
                        Managing custom content types defined in your schema.
                    </p>
                </div>
                <CopyPromptButton prompt={dynamicContentPrompt} />
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cuboid className="h-5 w-5" />
                            Content Types
                        </CardTitle>
                        <CardDescription>
                            Dynamic content relies on Schemas you define in the Dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Before querying, ensure you have created a <strong>Content Type</strong> (e.g., 'product', 'author', 'event') in the Content Builder.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="border rounded p-4">
                                <h3 className="font-semibold mb-2">1. Define Schema</h3>
                                <p className="text-xs text-muted-foreground">Create a 'product' type with fields: <code>name</code> (text), <code>price</code> (number).</p>
                            </div>
                            <div className="border rounded p-4">
                                <h3 className="font-semibold mb-2">2. Use API</h3>
                                <p className="text-xs text-muted-foreground">Query or Mutate using <code>_type: 'product'</code>.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            Usage Examples
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div>
                            <h3 className="text-sm font-medium mb-2">Querying Dynamic Content</h3>
                            <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                                {`// GET /api/cms/query?type=product
{
  "result": [
    {
      "_id": "...",
      "_type": "product",
      "name": "Super Widget",
      "price": 29.99
    }
  ]
}`}
                            </pre>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium mb-2">Creating Dynamic Content</h3>
                            <pre className="bg-gray-100 dark:bg-muted p-4 rounded overflow-x-auto text-sm">
                                {`// POST /api/cms/mutate
{
  "_type": "product",
  "name": "Super Widget",
  "price": 29.99,
  "published": true
}`}
                            </pre>
                        </div>

                    </CardContent>
                </Card>

                <DocsPager
                    prev={{
                        title: "Managing Content",
                        href: "./" // Since we are in content/dynamic, ./ goes to content/ (index)
                    }}
                />
            </div>
        </div>
    )
}
