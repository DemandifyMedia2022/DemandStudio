"use server"

import { revalidatePath } from "next/cache"
import { prisma as db } from "@/lib/prisma"

export async function addCorsOrigin(data: { origin: string; projectId: string; orgSlug: string; projectSlug: string }) {
    try {
        await db.corsOrigin.create({
            data: {
                origin: data.origin,
                projectId: data.projectId,
            },
        })

        revalidatePath(`/dashboard/${data.orgSlug}/projects/${data.projectSlug}/developer/cors-origins`)
        return { success: true }
    } catch (error) {
        console.error("Failed to add CORS origin:", error)
        return { success: false, error: "Failed to add CORS origin" }
    }
}

export async function deleteCorsOrigin(id: string, orgSlug: string, projectSlug: string) {
    try {
        await db.corsOrigin.delete({
            where: {
                id,
            },
        })

        revalidatePath(`/dashboard/${orgSlug}/projects/${projectSlug}/developer/cors-origins`)
        return { success: true }
    } catch (error) {
        console.error("Failed to delete CORS origin:", error)
        return { success: false, error: "Failed to delete CORS origin" }
    }
}
