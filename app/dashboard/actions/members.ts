"use server"

import { pool } from "@/lib/db"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function getOrganizationMembers(orgSlug: string) {
    const orgResult = await pool.query(`SELECT * FROM "Organization" WHERE "slug" = $1 LIMIT 1`, [orgSlug])
    const org = orgResult.rows[0]
    if (!org) return []

    const { rows } = await pool.query(
        `SELECT om.*, row_to_json(u.*) AS user
         FROM "OrganizationMember" om
         INNER JOIN "User" u ON u."id" = om."userId"
         WHERE om."organizationId" = $1
         ORDER BY om."createdAt" ASC`,
        [org.id]
    )

    return rows
}

export async function addMember(orgSlug: string, email: string, role: string, password?: string) {
    const orgResult = await pool.query(`SELECT * FROM "Organization" WHERE "slug" = $1 LIMIT 1`, [orgSlug])
    const org = orgResult.rows[0]

    if (!org) {
        throw new Error("Organization not found")
    }

    const userResult = await pool.query(`SELECT * FROM "User" WHERE "email" = $1 LIMIT 1`, [email])
    let user = userResult.rows[0]

    if (!user) {
        if (!password) {
            throw new Error("User not found and no password provided")
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const name = email.split("@")[0]
        const now = new Date()

        const createdUser = await pool.query(
            `INSERT INTO "User" ("id", "email", "name", "password", "role", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $6)
             RETURNING *`,
            [crypto.randomUUID(), email, name, hashedPassword, "USER", now]
        )
        user = createdUser.rows[0]
    }

    const existingResult = await pool.query(
        `SELECT "id" FROM "OrganizationMember" WHERE "organizationId" = $1 AND "userId" = $2 LIMIT 1`,
        [org.id, user.id]
    )

    if (existingResult.rows[0]) {
        throw new Error("User is already a member")
    }

    const now = new Date()
    await pool.query(
        `INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $5)`,
        [crypto.randomUUID(), org.id, user.id, role, now]
    )

    revalidatePath(`/dashboard/${orgSlug}/members`)
    return { success: true }
}

export async function updateMemberRole(orgSlug: string, memberId: string, role: string) {
    await pool.query(
        `UPDATE "OrganizationMember" SET "role" = $1, "updatedAt" = $2 WHERE "id" = $3`,
        [role, new Date(), memberId]
    )

    revalidatePath(`/dashboard/${orgSlug}/members`)
}

export async function removeMember(orgSlug: string, memberId: string) {
    await pool.query(`DELETE FROM "OrganizationMember" WHERE "id" = $1`, [memberId])

    revalidatePath(`/dashboard/${orgSlug}/members`)
}