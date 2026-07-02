import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { BlogForm } from "@/components/blogs/blog-form"

export default async function EditBlogPage(props: {
  params: Promise<{ orgSlug: string; projectSlug: string; id: string }>
}) {
  const { orgSlug, projectSlug, id } = await props.params;
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { rows } = await pool.query(`SELECT * FROM "Blog" WHERE "id" = $1 LIMIT 1`, [id])
  const blog = rows[0]

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
