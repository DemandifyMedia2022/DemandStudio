import { pool } from '../lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

async function main() {
    const email = "admin@demandifymedia.com"
    const password = "admin123"
    // Check if user already exists
    const existingResult = await pool.query(
        `SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1`,
        [email]
    )
    const existingUser = existingResult.rows[0]

    if (existingUser) {
        console.log(`User ${email} already exists. Updating password...`)
        const hashedPassword = await bcrypt.hash(password, 10)
        await pool.query(
            `UPDATE "User" SET "password" = $1, "updatedAt" = $2 WHERE "email" = $3`,
            [hashedPassword, new Date(), email]
        )
        console.log("Password updated successfully!")
    } else {
        console.log(`Creating user ${email}...`)
        const hashedPassword = await bcrypt.hash(password, 10)
        const now = new Date()
        await pool.query(
            `INSERT INTO "User" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $6)`,
            [crypto.randomUUID(), email, "Admin User", hashedPassword, "admin", now]
        )
        console.log("User created successfully!")
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await pool.end()
    })