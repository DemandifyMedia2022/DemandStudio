import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PostForm } from "@/components/posts/post-form"

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const post = await prisma.post.findUnique({
    where: { id },
  })

  if (!post) {
    redirect("/dashboard/posts")
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Post</h1>
      <PostForm userId={session.user.id} post={post} />
    </div>
  )
}
