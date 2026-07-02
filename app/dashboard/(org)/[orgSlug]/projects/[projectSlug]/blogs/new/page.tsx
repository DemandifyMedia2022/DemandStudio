import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { BlogForm } from "@/components/blogs/blog-form"

import { pool } from "@/lib/db"

export default async function NewBlogPage(props: {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const { orgSlug, projectSlug } = await props.params;

  const projectResult = await pool.query(
    `SELECT p.* FROM "Project" p
     INNER JOIN "Organization" o ON o."id" = p."organizationId"
     WHERE p."slug" = $1 AND o."slug" = $2
     LIMIT 1`,
    [projectSlug, orgSlug]
  )
  const project = projectResult.rows[0];

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">New Blog</h1>
      <BlogForm
        userId={session.user.id}
        organizationId={project.organizationId}
        projectId={project.id}
        redirectUrl={`/dashboard/${orgSlug}/projects/${projectSlug}/blogs`}
      />
    </div>
  )
}
