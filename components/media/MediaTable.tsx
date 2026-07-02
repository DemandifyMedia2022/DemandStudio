"use client";

import { MediaItem } from "@/services/mediaService";
import { FileTypeIcon, getFileTypeBadge, formatBytes } from "./FileTypeIcon";
import { Eye, Copy, Trash2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaTableProps {
  items: MediaItem[];
  onPreview: (item: MediaItem) => void;
  onCopy: (url: string) => void;
  onDelete: (item: MediaItem) => void;
  onSelect?: (item: MediaItem) => void;
}

export function MediaTable({ items, onPreview, onCopy, onDelete, onSelect }: MediaTableProps) {
  return (
    <div className="rounded-xl border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">File Name</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Size</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">Uploaded</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">URL</th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => {
              const badge = getFileTypeBadge(item.fileType);
              const date = new Date(item.uploadedAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
              });

              return (
                <tr
                  key={item.id}
                  className="hover:bg-muted/30 transition-colors duration-150 group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileTypeIcon fileType={item.fileType} size={18} className="shrink-0" />
                      <span className="truncate max-w-[180px] font-medium" title={item.filename}>
                        {item.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {formatBytes(item.size)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {date}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate text-xs text-muted-foreground font-mono" title={item.url}>
                      {item.url}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {onSelect ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary"
                          onClick={() => onSelect(item)}
                          title="Select"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Select
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onPreview(item)}
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onCopy(item.url)}
                            title="Copy URL"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => onDelete(item)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Skeleton rows for table loading state
export function MediaTableSkeleton() {
  return (
    <div className="rounded-xl border overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {["File Name", "Type", "Size", "Uploaded", "URL", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  <div className="h-3 bg-muted rounded w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-3 bg-muted rounded" style={{ width: `${60 + Math.random() * 40}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
