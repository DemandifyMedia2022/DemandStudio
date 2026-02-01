"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export async function getOrganizationMembers(orgSlug: string) {
    const org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        include: {
            members: {
                include: {
                    user: true
                }
            }
        }
    })

    return org ? org.members : []
}

export async function addMember(orgSlug: string, email: string, role: string, password?: string) {
    const org = await prisma.organization.findUnique({
        where: { slug: orgSlug }
    })

    if (!org) {
        throw new Error("Organization not found")
    }

    let user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        if (!password) {
            throw new Error("User not found and no password provided")
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const name = email.split("@")[0]

        user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: "USER"
            }
        })
    }

    const existingMember = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: org.id,
                userId: user.id
            }
        }
    })

    if (existingMember) {
        throw new Error("User is already a member")
    }

    await prisma.organizationMember.create({
        data: {
            organizationId: org.id,
            userId: user.id,
            role
        }
    })

    revalidatePath(`/dashboard/${orgSlug}/members`)
    return { success: true }
}

export async function updateMemberRole(orgSlug: string, memberId: string, role: string) {
    await prisma.organizationMember.update({
        where: { id: memberId },
        data: { role }
    })

    revalidatePath(`/dashboard/${orgSlug}/members`)
}

export async function removeMember(orgSlug: string, memberId: string) {
    await prisma.organizationMember.delete({
        where: { id: memberId }
    })

    revalidatePath(`/dashboard/${orgSlug}/members`)
}
