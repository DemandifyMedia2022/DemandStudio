"use server"

import { revalidatePath } from "next/cache"
import { pool } from "@/lib/db"
import crypto from "crypto"

export async function addCorsOrigin(data: { origin: string; projectId: string; orgSlug: string; projectSlug: string }) {
    try {
        const now = new Date()
        await pool.query(
            `INSERT INTO "CorsOrigin" ("id", "origin", "projectId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $4)`,
            [crypto.randomUUID(), data.origin, data.projectId, now]
        )

        revalidatePath(`/dashboard/${data.orgSlug}/projects/${data.projectSlug}/developer/cors-origins`)
        return { success: true }
    } catch (error) {
        console.error("Failed to add CORS origin:", error)
        return { success: false, error: "Failed to add CORS origin" }
    }
}

export async function deleteCorsOrigin(id: string, orgSlug: string, projectSlug: string) {
    try {
        await pool.query(`DELETE FROM "CorsOrigin" WHERE "id" = $1`, [id])

        revalidatePath(`/dashboard/${orgSlug}/projects/${projectSlug}/developer/cors-origins`)
        return { success: true }
    } catch (error) {
        console.error("Failed to delete CORS origin:", error)
        return { success: false, error: "Failed to delete CORS origin" }
    }
}