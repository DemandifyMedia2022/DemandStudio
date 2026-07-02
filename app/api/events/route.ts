import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const publishedOnly = searchParams.get("published") !== "false" // default to true for public API
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const contentTypeResult = await pool.query(
      `SELECT * FROM "ContentType" WHERE "slug" = $1 LIMIT 1`,
      ["events"]
    )
    const contentType = contentTypeResult.rows[0]

    if (!contentType) {
      // If the content type hasn't been created yet, handle gracefully
      return NextResponse.json({
        data: [],
        pagination: { total: 0, limit, offset, hasMore: false }
      })
    }

    const params: any[] = [contentType.id]
    let whereSql = `"contentTypeId" = $1`
    if (publishedOnly) {
      params.push(true)
      whereSql += ` AND "published" = $2`
    }

    const itemsResult = await pool.query(
      `SELECT * FROM "ContentItem" WHERE ${whereSql} ORDER BY "createdAt" DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
    const totalResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "ContentItem" WHERE ${whereSql}`,
      params
    )
    const items = itemsResult.rows
    const total = totalResult.rows[0]?.count ?? 0

    // Parse JSON data for response
    const parsedItems = items.map(item => {
      let parsedData = {}
      try {
        parsedData = typeof item.data === 'string' ? JSON.parse(item.data) : (item.data || {})
      } catch (e) {
        console.error("Error parsing content item data", e)
      }
      return {
        ...item,
        data: parsedData,
      }
    })

    // Return the same API structure as blogs
    return NextResponse.json({
      data: parsedItems,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching events:", error)
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    )
  }
}