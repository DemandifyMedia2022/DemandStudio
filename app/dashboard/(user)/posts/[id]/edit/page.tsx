import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
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

  const { rows } = await pool.query(`SELECT * FROM "Post" WHERE "id" = $1 LIMIT 1`, [id])
  const post = rows[0]

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
