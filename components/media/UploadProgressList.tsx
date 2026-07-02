"use client";

import { UploadState } from "@/hooks/useMediaUpload";
import { FileTypeIcon } from "./FileTypeIcon";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface UploadProgressListProps {
  uploads: UploadState[];
}

export function UploadProgressList({ uploads }: UploadProgressListProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="space-y-2">
      {uploads.map((u, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm"
        >
          <FileTypeIcon fileType={u.file.type} size={18} />

          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-foreground">{u.file.name}</p>

            {u.status === "uploading" && (
              <div className="mt-1.5">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{u.progress}%</p>
              </div>
            )}

            {u.status === "error" && (
              <p className="text-xs text-destructive mt-0.5">{u.error}</p>
            )}

            {u.status === "done" && (
              <p className="text-xs text-green-500 mt-0.5">Upload complete</p>
            )}
          </div>

          {u.status === "uploading" && (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          )}
          {u.status === "done" && (
            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
          )}
          {u.status === "error" && (
            <XCircle className="h-4 w-4 text-destructive shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
