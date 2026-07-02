import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { corsHeaders, corsMiddleware } from "@/lib/cors"
import crypto from "crypto"

export async function OPTIONS(request: NextRequest) {
  return corsMiddleware(request) || new NextResponse(null, { status: 200, headers: corsHeaders(request) })
}

function commentSelectSql() {
  return `SELECT c.*,
    CASE WHEN b."id" IS NULL THEN NULL ELSE json_build_object('title', b."title", 'organizationId', b."organizationId") END AS blog,
    CASE WHEN p."id" IS NULL THEN NULL ELSE json_build_object('content', p."content") END AS parent
   FROM "Comment" c
   LEFT JOIN "Blog" b ON b."id" = c."blogId"
   LEFT JOIN "Comment" p ON p."id" = c."parentId"`
}

export async function GET(request: NextRequest) {
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(request) })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const projectSlug = searchParams.get("projectSlug")
    const orgSlug = searchParams.get("orgSlug")
    const organizationId = searchParams.get("organizationId")
    const skip = Math.max(0, (page - 1) * limit)

    const params: any[] = []
    const clauses: string[] = []

    if (status && status !== "all" && typeof status === 'string') {
      params.push(status)
      clauses.push(`c."status" = $${params.length}`)
    }

    if (session.user.role !== "admin") {
      if (!organizationId && !orgSlug) {
         return NextResponse.json({ error: "Organization context required" }, { status: 400 })
      }

      const membershipResult = organizationId
        ? await pool.query(
            `SELECT * FROM "OrganizationMember" WHERE "userId" = $1 AND "organizationId" = $2 LIMIT 1`,
            [session.user.id, organizationId]
          )
        : await pool.query(
            `SELECT om.* FROM "OrganizationMember" om INNER JOIN "Organization" o ON o."id" = om."organizationId" WHERE om."userId" = $1 AND o."slug" = $2 LIMIT 1`,
            [session.user.id, orgSlug]
          )
      const membership = membershipResult.rows[0]

      console.log("USER:", session.user.id);
      console.log("ORG:", organizationId || orgSlug);
      console.log("MEMBERSHIP_FOUND:", !!membership);

      if (organizationId) {
        params.push(organizationId)
        clauses.push(`b."organizationId" = $${params.length}`)
      } else if (orgSlug) {
        params.push(orgSlug)
        clauses.push(`EXISTS (SELECT 1 FROM "Organization" o WHERE o."id" = b."organizationId" AND o."slug" = $${params.length})`)
      }

      if (projectSlug && typeof projectSlug === 'string') {
        params.push(projectSlug)
        clauses.push(`EXISTS (SELECT 1 FROM "Project" pr WHERE pr."id" = b."projectId" AND pr."slug" = $${params.length})`)
      }
    } else if (organizationId || orgSlug || projectSlug) {
      if (organizationId) {
        params.push(organizationId)
        clauses.push(`b."organizationId" = $${params.length}`)
      } else if (orgSlug && typeof orgSlug === 'string') {
        params.push(orgSlug)
        clauses.push(`EXISTS (SELECT 1 FROM "Organization" o WHERE o."id" = b."organizationId" AND o."slug" = $${params.length})`)
      }
      if (projectSlug && typeof projectSlug === 'string') {
        params.push(projectSlug)
        clauses.push(`EXISTS (SELECT 1 FROM "Project" pr WHERE pr."id" = b."projectId" AND pr."slug" = $${params.length})`)
      }
    }

    if (search && typeof search === 'string') {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(`(c."name" ILIKE $${idx} OR c."content" ILIKE $${idx} OR c."email" ILIKE $${idx})`)
    }

    const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""
    const commentsResult = await pool.query(
      `${commentSelectSql()} ${whereSql} ORDER BY c."createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, skip]
    )
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Comment" c LEFT JOIN "Blog" b ON b."id" = c."blogId" ${whereSql}`,
      params
    )
    const total = totalResult.rows[0]?.count ?? 0

    return NextResponse.json({
      comments: commentsResult.rows || [],
      total: total || 0,
      pages: Math.ceil((total || 0) / limit),
      currentPage: page,
    }, { headers: corsHeaders(request) })

  } catch (error) {
    console.error("COMMENTS GET ERROR:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch comments", comments: [], total: 0 },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}

export async function POST(request: NextRequest) {
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const body = await request.json()
    const { name, email, comment, blogId, projectId, parentId } = body

    if (!name || !email || !comment || !blogId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: corsHeaders(request) }
      )
    }

    const now = new Date()
    const { rows } = await pool.query(
      `INSERT INTO "Comment" ("id", "name", "email", "content", "blogId", "projectId", "parentId", "status", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *`,
      [crypto.randomUUID(), name, email, comment, blogId, projectId || null, parentId || null, "pending", now]
    )

    return NextResponse.json(
      { success: true, data: rows[0] },
      { status: 201, headers: corsHeaders(request) }
    )
  } catch (error) {
    console.error("COMMENTS POST ERROR:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create comment" },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}

export async function PATCH(request: NextRequest) {
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(request) })
    }

    const body = await request.json()
    const { ids, status, organizationId } = body

    if (!ids || !Array.isArray(ids) || !status) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const commentsResult = await pool.query(
      `SELECT c."id", b."organizationId"
       FROM "Comment" c
       LEFT JOIN "Blog" b ON b."id" = c."blogId"
       WHERE c."id" = ANY($1::text[])`,
      [ids]
    )
    const checkedOrgs = new Set<string>();

    for (const comment of commentsResult.rows) {
      const orgId = organizationId || comment.organizationId;
      if (!orgId) continue;

      if (!checkedOrgs.has(orgId)) {
        const membershipResult = await pool.query(
          `SELECT * FROM "OrganizationMember" WHERE "userId" = $1 AND "organizationId" = $2 LIMIT 1`,
          [session.user.id, orgId]
        )
        const membership = membershipResult.rows[0]

        console.log("USER:", session.user.id);
        console.log("ORG:", orgId);
        console.log("MEMBERSHIP:", membership);

        if (!membership) {
          return NextResponse.json({ error: "No membership found" }, { status: 403, headers: corsHeaders(request) });
        }

        if (membership.role !== "OWNER") {
          return NextResponse.json({ error: "Forbidden - Only OWNER allowed" }, { status: 403, headers: corsHeaders(request) });
        }

        checkedOrgs.add(orgId);
      }
    }

    await pool.query(
      `UPDATE "Comment" SET "status" = $1, "updatedAt" = $2 WHERE "id" = ANY($3::text[])`,
      [status, new Date(), ids]
    )

    return NextResponse.json({ success: true }, { headers: corsHeaders(request) })
  } catch (error) {
    console.error("COMMENTS PATCH ERROR:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update comments" },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}