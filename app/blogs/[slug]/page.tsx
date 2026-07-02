import { notFound } from "next/navigation"
import { pool } from "@/lib/db"
import { Metadata } from "next"
import { ClientSideContent } from "./client-content"

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

interface BlogPostProps {
    params: Promise<{
        slug: string
    }>
}

async function getBlogPost(slug: string) {
    const { rows } = await pool.query(
        `SELECT b.*, row_to_json(u.*) AS author
         FROM "Blog" b
         LEFT JOIN "User" u ON u."id" = b."authorId"
         WHERE b."slug" = $1
         LIMIT 1`,
        [slug]
    )

    // Start with finding just by slug.
    // In a real app we might check published status, but for "Preview" 
    // from the dashboard, we probably want to see it even if unpublished.
    // We could add logic to only show unpublished if the user is authenticated, 
    // but for now let's just show it.

    return rows[0] ?? null
}

export async function generateMetadata({ params }: BlogPostProps): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getBlogPost(slug)

    if (!blog) {
        return {
            title: "Blog Not Found",
        }
    }

    return {
        title: blog.seoTitle || blog.title,
        description: blog.seoDescription || blog.excerpt,
        keywords: blog.metaKeywords?.split(","),
        openGraph: {
            title: blog.seoTitle || blog.title,
            description: blog.seoDescription || blog.excerpt || "",
            images: blog.ogImage ? [{ url: blog.ogImage }] : blog.image ? [{ url: blog.image }] : [],
        },
    }
}

export default async function BlogPostPage({ params }: BlogPostProps) {
    const { slug } = await params;
    const blog = await getBlogPost(slug)

    if (!blog) {
        notFound()
    }

    // Parse structured data if it exists
    let jsonLd = null
    let faqSchema = null

    try {
        if (blog.jsonLd) jsonLd = typeof blog.jsonLd === 'string' ? JSON.parse(blog.jsonLd) : blog.jsonLd
        if (blog.faqSchema) faqSchema = typeof blog.faqSchema === 'string' ? JSON.parse(blog.faqSchema) : blog.faqSchema
    } catch (e) {
        console.error("Error parsing schema", e)
    }

    return (
        <article className="container max-w-4xl mx-auto py-12 px-4">
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
                />
            )}

            <div className="space-y-4 mb-8 text-center">
                {blog.category && (
                    <span className="bg-muted px-3 py-1 rounded-full text-sm font-medium">
                        {blog.category}
                    </span>
                )}
                <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                    {blog.title}
                </h1>
                {blog.excerpt && (
                    <p className="text-xl text-muted-foreground">{blog.excerpt}</p>
                )}
                <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                    <span>{blog.author.name}</span>
                    <span>•</span>
                    <span>
                        {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {blog.image && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-10">
                    <img
                        src={blog.image}
                        alt={blog.title}
                        className="object-cover w-full h-full"
                    />
                </div>
            )}

            {/* Render Content */}
            {/* 
        Note: The content is stored as serialized Lexical JSON. 
        For a proper public view, we would need a renderer that converts Lexical state to HTML.
        For now, since we don't have a dedicated renderer component set up for the frontend,
        we might need to implement a basic one or re-use the read-only editor.
        
        However, re-using the Editor component might be heavy. 
        A better approach for SEO is usually converting to HTML on save, or having a lightweight HTML renderer.
        
        Given the current scope, I'll try to use a read-only instance of the existing Editor component if possible,
        or just display a "Content renderer placeholder" if that's too complex for this step.
        
        Actually, let's try to import the Editor in read-only mode.
      */}

            <div className="prose prose-lg dark:prose-invert max-w-none">
                <ClientSideContent content={blog.content} />
            </div>

            {/* FAQs Section */}
            {blog.faqs && (
                <div className="mt-12 pt-8 border-t">
                    <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
                    <div className="space-y-6">
                        {(() => {
                            try {
                                const faqs = typeof blog.faqs === 'string' ? JSON.parse(blog.faqs) : blog.faqs;
                                if (Array.isArray(faqs)) {
                                    return faqs.map((faq: any, i: number) => (
                                        <div key={i} className="space-y-2">
                                            <h3 className="font-semibold text-lg">{faq.question}</h3>
                                            {/* Simplified answer rendering for now */}
                                            <div className="text-muted-foreground">
                                                <ClientSideContent content={faq.answer} />
                                            </div>
                                        </div>
                                    ))
                                }
                            } catch (e) { return null }
                        })()}
                    </div>
                </div>
            )}

        </article>
    )
}


