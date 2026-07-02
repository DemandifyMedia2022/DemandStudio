import { notFound } from "next/navigation"
import { MediaLibraryClient } from "@/components/media/MediaLibraryClient"
import { pool } from "@/lib/db"

export default async function ProjectMediaPage(props: {
  params: Promise<{ orgSlug: string; projectSlug: string }>
}) {
  const params = await props.params

  const { rows } = await pool.query(
    `SELECT p."id", p."organizationId"
     FROM "Project" p
     INNER JOIN "Organization" o ON o."id" = p."organizationId"
     WHERE p."slug" = $1 AND o."slug" = $2
     LIMIT 1`,
    [params.projectSlug, params.orgSlug]
  )
  const project = rows[0]

  if (!project) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <MediaLibraryClient organizationId={project.organizationId} projectId={project.id} />
    </div>
  )
}