"use client";

import { useState } from "react";
import { MediaItem } from "@/services/mediaService";
import { FileTypeIcon } from "./FileTypeIcon";
import { X, ExternalLink, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaPreviewModalProps {
  item: MediaItem | null;
  onClose: () => void;
  onCopy: (url: string) => void;
}

export function MediaPreviewModal({ item, onClose, onCopy }: MediaPreviewModalProps) {
  if (!item) return null;

  const isImage = item.fileType.startsWith("image/");
  const isVideo = item.fileType.startsWith("video/");
  const isPdf = item.fileType === "application/pdf";

  const handlePdfOpen = () => {
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileTypeIcon fileType={item.fileType} size={20} />
            <p className="font-semibold truncate">{item.filename}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCopy(item.url)}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy URL
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(item.url, "_blank")}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Open
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 p-4 min-h-[300px]">
          {isImage && (
            <img
              src={item.url}
              alt={item.filename}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow"
            />
          )}

          {isVideo && (
            <video
              src={item.url}
              controls
              className="max-h-[60vh] max-w-full rounded-lg shadow"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {isPdf && (
            <div className="text-center space-y-4 py-8">
              <FileTypeIcon fileType={item.fileType} size={64} />
              <div>
                <p className="font-medium text-lg">{item.filename}</p>
                <p className="text-sm text-muted-foreground mt-1">PDF files open in a new tab</p>
              </div>
              <Button onClick={handlePdfOpen} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open PDF
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ──────────────────────────────────────────────────
interface DeleteConfirmModalProps {
  item: MediaItem | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DeleteConfirmModal({ item, onConfirm, onCancel, loading }: DeleteConfirmModalProps) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-bold">Delete Media</h2>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{item.filename}</span>? This action
            cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
