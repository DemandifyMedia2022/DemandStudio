export type MediaItem = {
  id: string
  filename: string
  url: string
  fileType: string
  size: number
  uploadedAt: string
  organizationId?: string
  projectId?: string
}

function inferFileType(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(ext ?? "")) return `image/${ext === "jpg" ? "jpeg" : ext}`
  if (ext === "pdf") return "application/pdf"
  if (["mp4", "webm", "mov"].includes(ext ?? "")) return `video/${ext}`
  return "application/octet-stream"
}

export async function fetchMediaItems(organizationId?: string, projectId?: string): Promise<MediaItem[]> {
  const params = new URLSearchParams()
  if (organizationId) params.set("organizationId", organizationId)
  if (projectId) params.set("projectId", projectId)
  const res = await fetch(`/api/upload${params.size ? `?${params}` : ""}`)
  if (!res.ok) throw new Error("Failed to fetch media items")
  const data = await res.json()
  return data.items ?? []
}

export async function uploadMediaFile(
  file: File,
  organizationId?: string,
  projectId?: string,
  onProgress?: (progress: number) => void,
  folder?: string
): Promise<MediaItem> {
  const formData = new FormData()
  formData.append("file", file)
  if (organizationId) formData.append("organizationId", organizationId)
  if (projectId) formData.append("projectId", projectId)
  if (folder) formData.append("folder", folder)

  onProgress?.(10)
  const res = await fetch("/api/upload", { method: "POST", body: formData })
  onProgress?.(90)
  if (!res.ok) throw new Error("Upload failed")
  const data = await res.json()
  onProgress?.(100)

  const filename = data.filename ?? String(data.url).split("/").pop() ?? file.name
  return {
    id: data.id ?? filename,
    filename,
    url: data.url,
    fileType: data.fileType ?? (file.type || inferFileType(filename)),
    size: data.size ?? file.size,
    uploadedAt: data.uploadedAt ?? new Date().toISOString(),
    organizationId,
    projectId,
  }
}

export async function deleteMediaItem(idOrUrl: string): Promise<void> {
  const res = await fetch(`/api/upload?id=${encodeURIComponent(idOrUrl)}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete media item")
}
