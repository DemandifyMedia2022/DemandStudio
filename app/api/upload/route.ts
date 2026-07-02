import { NextRequest, NextResponse } from "next/server"
import { existsSync } from "fs"
import { mkdir, readdir, stat, unlink, writeFile } from "fs/promises"
import { join, relative, sep } from "path"

const uploadRoot = join(process.cwd(), "public", "uploads")

function inferFileType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(ext ?? "")) {
    return `image/${ext === "jpg" ? "jpeg" : ext}`
  }
  if (ext === "pdf") return "application/pdf"
  if (["mp4", "webm", "mov"].includes(ext ?? "")) return `video/${ext}`
  return "application/octet-stream"
}

function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "") || "upload"
}

function scopedUploadDir(projectId: string | null) {
  return projectId ? join(uploadRoot, "projects", safeFilename(projectId)) : uploadRoot
}

function publicUrlFromPath(path: string) {
  const rel = relative(uploadRoot, path).split(sep).join("/")
  return `/uploads/${rel}`
}

function resolveUploadPath(idOrUrl: string) {
  const withoutQuery = idOrUrl.split("?")[0]
  const relativePath = withoutQuery.replace(/^\/uploads\//, "").replace(/^uploads\//, "")
  const resolved = join(uploadRoot, relativePath)
  const rootWithSep = uploadRoot.endsWith(sep) ? uploadRoot : `${uploadRoot}${sep}`

  if (resolved !== uploadRoot && !resolved.startsWith(rootWithSep)) {
    return null
  }

  return resolved
}

async function listFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return []

  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return listFiles(path)
      if (entry.isFile()) return [path]
      return []
    })
  )

  return files.flat()
}

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId")
    const files = await listFiles(scopedUploadDir(projectId))
    const items = await Promise.all(
      files.map(async (path) => {
        const fileStat = await stat(path)
        const filename = path.split(/[\\/]/).pop() || ""
        const url = publicUrlFromPath(path)

        return {
          id: url,
          filename,
          url,
          fileType: inferFileType(filename),
          size: fileStat.size,
          uploadedAt: fileStat.birthtime.toISOString(),
          projectId: projectId || undefined,
        }
      })
    )

    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return NextResponse.json({ items })
  } catch (error) {
    console.error("Media list error:", error)
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const organizationId = formData.get("organizationId")?.toString() || undefined
    const projectId = formData.get("projectId")?.toString() || undefined

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    const filename = `${uniqueSuffix}-${safeFilename(file.name)}`
    const uploadDir = scopedUploadDir(projectId || null)

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const path = join(uploadDir, filename)
    await writeFile(path, buffer)

    const url = publicUrlFromPath(path)
    const uploadedAt = new Date().toISOString()

    return NextResponse.json({
      id: url,
      filename,
      url,
      fileType: file.type || inferFileType(filename),
      size: file.size,
      uploadedAt,
      organizationId,
      projectId,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing media id" }, { status: 400 })
    }

    const path = resolveUploadPath(id)

    if (!path || !existsSync(path)) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    await unlink(path)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json({ error: "Failed to delete media" }, { status: 500 })
  }
}