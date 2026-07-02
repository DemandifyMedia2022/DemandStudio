import { pool } from '../lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

async function main() {
  // Check if admin user already exists
  const existingResult = await pool.query(
    `SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1`,
    ["admin@example.com"]
  )

  if (existingResult.rows[0]) {
    console.log("Admin user already exists!")
    return
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

  console.log("Admin user created successfully!")
  console.log("Email:", user.email)
  console.log("Password: admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })