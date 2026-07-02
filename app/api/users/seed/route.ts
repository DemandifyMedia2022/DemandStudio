import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST() {
  try {
    // Check if admin user already exists
    const existingResult = await pool.query(
      `SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1`,
      ["admin@example.com"]
    )

    if (existingResult.rows[0]) {
      return NextResponse.json(
        { message: "Admin user already exists" },
        { status: 400 }
      )
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10)
    const now = new Date()

    const { rows } = await pool.query(
      `INSERT INTO "User" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *`,
      [crypto.randomUUID(), "admin@example.com", "Admin User", hashedPassword, "admin", now]
    )
    const user = rows[0]

    return NextResponse.json(
      {
        message: "Admin user created successfully",
        user: { email: user.email, name: user.name },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error seeding user:", error)
    return NextResponse.json(
      { error: "Failed to seed user" },
      { status: 500 }
    )
  }
}