import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BlogForm } from "@/components/blogs/blog-form"

export default async function EditBlogPage(props: {
  params: Promise<{ orgSlug: string; projectSlug: string; id: string }>
}) {
  const { orgSlug, projectSlug, id } = await props.params;
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const blog = await prisma.blog.findUnique({
    where: { id },
  })

  if (!blog) {
    // Redirect to the correct list page if not found
    redirect(`/dashboard/${orgSlug}/projects/${projectSlug}/blogs`)
  }

  return (
    <div>
      <BlogForm
        userId={session.user.id}
        blog={blog}
        redirectUrl={`/dashboard/${orgSlug}/projects/${projectSlug}/blogs`}
      />
    </div>
  )
}
