import { NextRequest, NextResponse } from 'next/server'
import { pool } from './db'
import { corsHeaders } from './cors'

export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; userId?: string; error?: string }> {
  // Check for API key in header
  const apiKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '')

  if (!apiKey) {
    return { valid: false, error: 'API key is required' }
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM "ApiKey" WHERE "key" = $1 LIMIT 1`,
      [apiKey]
    )
    const keyRecord = rows[0]

    if (!keyRecord || !keyRecord.active) {
      return { valid: false, error: 'Invalid or inactive API key' }
    }

    // Check if key is expired
    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return { valid: false, error: 'API key has expired' }
    }

    // Update last used timestamp
    await pool.query(
      `UPDATE "ApiKey" SET "lastUsed" = $1, "updatedAt" = $1 WHERE "id" = $2`,
      [new Date(), keyRecord.id]
    )

    return { valid: true, userId: keyRecord.userId }
  } catch (error) {
    console.error('API key validation error:', error)
    return { valid: false, error: 'Error validating API key' }
  }
}

export function apiErrorResponse(message: string, status: number = 401, request: NextRequest) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: corsHeaders(request),
    }
  )
}

export function apiSuccessResponse(data: any, status: number = 200, request: NextRequest) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(request),
  })
}