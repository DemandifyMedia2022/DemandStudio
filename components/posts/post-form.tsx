"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/ui/image-uploader"

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  published: z.boolean(),
  featured: z.boolean(),
  tags: z.string().optional(),
  image: z.string().optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface PostFormProps {
  userId: string
  post?: {
    id: string
    title: string
    slug: string
    content: string
    excerpt?: string | null
    published: boolean
    featured: boolean
    tags?: string | null
    image?: string | null
  }
  organizationId?: string
  projectId?: string
  redirectUrl?: string
}

export function PostForm({ userId, post, organizationId, projectId, redirectUrl }: PostFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: post
      ? {
        title: post.title,
        slug: post.slug,
        content: post.content,
        excerpt: post.excerpt || "",
        published: post.published,
        featured: post.featured,
        tags: post.tags || "",
        image: post.image || "",
      }
      : {
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        published: false,
        featured: false,
        tags: "",
        image: "",
      },
  })

  const title = watch("title")
  useEffect(() => {
    if (!post && title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
      setValue("slug", slug)
    }
  }, [title, setValue, post])

  const onSubmit = async (data: PostFormData) => {
    setLoading(true)
    try {
      const url = post ? `/api/posts/${post.id}` : "/api/posts"
      const method = post ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          authorId: userId,
          publishedAt: data.published ? new Date().toISOString() : null,
          organizationId,
          projectId,
        }),
      })

      if (response.ok) {
        if (redirectUrl) {
          router.push(redirectUrl)
        } else {
          router.push("/dashboard/posts")
        }
        router.refresh()
      } else {
        alert("Failed to save post")
      }
    } catch (error) {
      alert("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post ? "Edit Post" : "Create Post"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter post title"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="post-url-slug"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              {...register("excerpt")}
              placeholder="Brief description of the post"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              {...register("content")}
              placeholder="Post content"
              rows={10}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="tag1, tag2, tag3"
            />
          </div>

          <div className="space-y-2">
            <ImageUploader
              label="Cover Image"
              value={watch("image") || ""}
              onChange={(url) => setValue("image", url, { shouldValidate: true })}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium px-3 py-1.5 rounded-md border bg-muted">
              Status: <span className={watch("published") ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                {watch("published") ? "Published" : "Draft"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="featured"
                {...register("featured")}
                className="h-4 w-4"
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="secondary" 
              disabled={loading}
              onClick={async () => {
                setValue("published", false)
                await handleSubmit(onSubmit)()
              }}
            >
              {loading && !watch("published") ? "Saving Draft..." : "Save as Draft"}
            </Button>
            <Button 
              type="button" 
              disabled={loading}
              onClick={async () => {
                setValue("published", true)
                await handleSubmit(onSubmit)()
              }}
            >
              {loading && watch("published") ? "Publishing..." : "Publish"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

