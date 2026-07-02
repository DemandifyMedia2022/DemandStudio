"use client";

import { useRef } from "react";
import { UploadCloud } from "lucide-react";

interface MediaUploadZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFiles: (files: File[]) => void;
  uploading?: boolean;
}

export function MediaUploadZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFiles,
  uploading = false,
}: MediaUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed
        p-10 cursor-pointer transition-all duration-200 select-none
        ${isDragging
          ? "border-primary bg-primary/10 scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
        }
        ${uploading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <div
        className={`
          flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200
          ${isDragging ? "bg-primary/20 scale-110" : "bg-muted"}
        `}
      >
        <UploadCloud
          className={`h-8 w-8 transition-colors duration-200 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>

      <div className="text-center">
        <p className="text-base font-semibold">
          {isDragging ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or{" "}
          <span className="text-primary font-medium underline underline-offset-2">
            browse files
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Supported: PNG, JPG, JPEG, WEBP, PDF, MP4 &nbsp;·&nbsp; Max 10 MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.pdf,.mp4,image/*,application/pdf,video/mp4"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
