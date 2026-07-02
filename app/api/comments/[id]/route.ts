import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pool } from "@/lib/db"
import { corsHeaders, corsMiddleware } from "@/lib/cors"

export async function OPTIONS(request: NextRequest) {
  return corsMiddleware(request) || new NextResponse(null, { status: 200, headers: corsHeaders(request) })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const corsResponse = corsMiddleware(request)
  if (corsResponse) return corsResponse

  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders(request) })
    }

    const { id } = await params
    const body = await request.json()
    const { status, organizationId } = body

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400, headers: corsHeaders(request) })
    }

    const commentResult = await pool.query(
      `SELECT c.*, b."organizationId"
       FROM "Comment" c
       LEFT JOIN "Blog" b ON b."id" = c."blogId"
       WHERE c."id" = $1
       LIMIT 1`,
      [id]
    )
    const commentData = commentResult.rows[0]

    if (!commentData) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404, headers: corsHeaders(request) })
    }

    const orgId = organizationId || commentData.organizationId;

    if (!orgId) {
      return NextResponse.json({ error: "Organization context not found" }, { status: 400, headers: corsHeaders(request) })
    }

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
      return NextResponse.json({
        error: "Forbidden - Only OWNER allowed"
      }, { status: 403, headers: corsHeaders(request) })
    }

    const { rows } = await pool.query(
      `UPDATE "Comment" SET "status" = $1, "updatedAt" = $2 WHERE "id" = $3 RETURNING *`,
      [status, new Date(), id]
    )

    return NextResponse.json(rows[0], { headers: corsHeaders(request) })
  } catch (error) {
    console.error("COMMENT PATCH ERROR:", error)
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update comment" },
      { status: 500, headers: corsHeaders(request) }
    )
  }
}