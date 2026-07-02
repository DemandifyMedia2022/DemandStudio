"use client";

import { FileText, ImageIcon, Video, File } from "lucide-react";

interface FileTypeIconProps {
  fileType: string;
  className?: string;
  size?: number;
}

export function FileTypeIcon({ fileType, className = "", size = 24 }: FileTypeIconProps) {
  const props = { className, size };

  if (fileType.startsWith("image/")) {
    return <ImageIcon {...props} className={`${className} text-blue-500`} />;
  }
  if (fileType === "application/pdf") {
    return <FileText {...props} className={`${className} text-red-500`} />;
  }
  if (fileType.startsWith("video/")) {
    return <Video {...props} className={`${className} text-purple-500`} />;
  }
  return <File {...props} className={`${className} text-gray-400`} />;
}

export function getFileTypeBadge(fileType: string): { label: string; color: string } {
  if (fileType.startsWith("image/")) return { label: "Image", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
  if (fileType === "application/pdf") return { label: "PDF", color: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (fileType.startsWith("video/")) return { label: "Video", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
  return { label: "File", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
