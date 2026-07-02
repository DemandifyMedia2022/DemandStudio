"use client";

import { MediaItem } from "@/services/mediaService";
import { FileTypeIcon, getFileTypeBadge, formatBytes } from "./FileTypeIcon";
import { Eye, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaGridCardProps {
  item: MediaItem;
  onPreview: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
  onSelect?: (item: MediaItem) => void;
}

export function MediaGridCard({ item, onPreview, onCopy, onDelete, onSelect }: MediaGridCardProps) {
  const badge = getFileTypeBadge(item.fileType);
  const isImage = item.fileType.startsWith("image/");
  const date = new Date(item.uploadedAt).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  return (
    <div className="group relative flex flex-col rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Preview area */}
      <div className="relative h-40 bg-muted flex items-center justify-center overflow-hidden">
        {isImage ? (
          <img
            src={item.url}
            alt={item.filename}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4">
            <FileTypeIcon fileType={item.fileType} size={40} />
            <span className="text-xs text-muted-foreground text-center truncate max-w-[120px]">
              {item.filename}
            </span>
          </div>
        )}

        {/* Hover overlay actions */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          {onSelect ? (
            <Button
              size="sm"
              className="gap-2"
              onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Select
            </Button>
          ) : (
            <>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onPreview(item); }}
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onCopy(item.url); }}
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); onDelete(item); }}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Info area */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-medium truncate" title={item.filename}>
          {item.filename}
        </p>
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
            {badge.label}
          </span>
          <span className="text-xs text-muted-foreground">{formatBytes(item.size)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

// ── Skeleton Card ──────────────────────────────────────────────────────────────
export function MediaGridCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border bg-card overflow-hidden shadow-sm animate-pulse">
      <div className="h-40 bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}
