"use client"

import { useCallback, useState } from "react"
import { MediaItem, uploadMediaFile } from "@/services/mediaService"

export type UploadState = {
  file: File
  progress: number
  status: "uploading" | "done" | "error"
  error?: string
}

export function useMediaUpload(organizationId?: string, projectId?: string) {
  const [uploads, setUploads] = useState<UploadState[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const uploadFiles = useCallback(async (
    files: File[],
    onSuccess?: (item: MediaItem) => void,
    onError?: (filename: string, message: string) => void
  ) => {
    for (const file of files) {
      setUploads((prev) => [{ file, progress: 0, status: "uploading" }, ...prev])
      try {
        const item = await uploadMediaFile(file, organizationId, projectId, (progress) => {
          setUploads((prev) => prev.map((upload) => upload.file === file ? { ...upload, progress } : upload))
        })
        setUploads((prev) => prev.map((upload) => upload.file === file ? { ...upload, progress: 100, status: "done" } : upload))
        onSuccess?.(item)
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed"
        setUploads((prev) => prev.map((upload) => upload.file === file ? { ...upload, status: "error", error: message } : upload))
        onError?.(file.name, message)
      }
    }
  }, [organizationId, projectId])

  const clearUploads = useCallback(() => setUploads([]), [])
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
  }, [])
  const handleDrop = useCallback((
    event: React.DragEvent,
    onSuccess?: (item: MediaItem) => void,
    onError?: (filename: string, message: string) => void
  ) => {
    event.preventDefault()
    setIsDragging(false)
    uploadFiles(Array.from(event.dataTransfer.files), onSuccess, onError)
  }, [uploadFiles])

  return { uploads, isDragging, uploadFiles, clearUploads, handleDragOver, handleDragLeave, handleDrop }
}
