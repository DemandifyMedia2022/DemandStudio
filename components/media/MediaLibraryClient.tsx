"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Search, LayoutGrid, List, UploadCloud, RefreshCw, X, ImageIcon, FileText, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { MediaItem, fetchMediaItems, deleteMediaItem } from "@/services/mediaService";
import { useMediaUpload } from "@/hooks/useMediaUpload";

import { MediaUploadZone } from "@/components/media/MediaUploadZone";
import { UploadProgressList } from "@/components/media/UploadProgressList";
import { MediaGridCard, MediaGridCardSkeleton } from "@/components/media/MediaGridCard";
import { MediaTable, MediaTableSkeleton } from "@/components/media/MediaTable";
import { MediaPreviewModal, DeleteConfirmModal } from "@/components/media/MediaModals";
import { MediaEmptyState } from "@/components/media/MediaEmptyState";

type ViewMode = "grid" | "list";
type FilterType = "all" | "image" | "pdf" | "video";

interface MediaLibraryClientProps {
  organizationId: string;
  projectId?: string;
  onSelect?: (item: MediaItem) => void;
}

export function MediaLibraryClient({ organizationId, projectId, onSelect }: MediaLibraryClientProps) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  const {
    uploads, isDragging, uploadFiles, clearUploads,
    handleDragOver, handleDragLeave, handleDrop,
  } = useMediaUpload(organizationId, projectId);

  // ── Load media ─────────────────────────────────────────────────────────────
  const loadMedia = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMediaItems(organizationId, projectId);
      setMedia(data);
    } catch {
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  // ── Upload handlers ────────────────────────────────────────────────────────
  const handleFiles = useCallback((files: File[]) => {
    uploadFiles(
      files,
      (newItem) => {
        setMedia((prev) => [newItem, ...prev]);
        toast.success(`${newItem.filename} uploaded successfully`);
      },
      (filename, msg) => {
        toast.error(`${filename}: ${msg}`);
      }
    );
  }, [uploadFiles]);

  const handleDropWrapper = useCallback((e: React.DragEvent) => {
    handleDrop(e,
      (newItem) => {
        setMedia((prev) => [newItem, ...prev]);
        toast.success(`${newItem.filename} uploaded successfully`);
      },
      (filename, msg) => {
        toast.error(`${filename}: ${msg}`);
      }
    );
  }, [handleDrop]);

  // ── Copy URL ───────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async (url: string) => {
    if (!url) {
      toast.error("No URL found");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand("copy");
        textArea.remove();
        
        if (!successful) {
          throw new Error("Fallback copy failed");
        }
      }
      toast.success("URL copied to clipboard");
    } catch (err) {
      console.error("COPY ERROR:", err);
      toast.error("Failed to copy URL");
    }
  }, []);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMediaItem(deleteTarget.id);
      setMedia((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success(`${deleteTarget.filename} deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete media item");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  // ── Filter & Search ────────────────────────────────────────────────────────
  const filtered = media.filter((item) => {
    const matchesSearch =
      !search ||
      item.filename.toLowerCase().includes(search.toLowerCase()) ||
      item.url.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      filterType === "all" ||
      (filterType === "image" && item.fileType.startsWith("image/")) ||
      (filterType === "pdf" && item.fileType === "application/pdf") ||
      (filterType === "video" && item.fileType.startsWith("video/"));

    return matchesSearch && matchesType;
  });

  const filterButtons: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "All", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { key: "image", label: "Images", icon: <ImageIcon className="h-3.5 w-3.5" /> },
    { key: "pdf", label: "PDFs", icon: <FileText className="h-3.5 w-3.5" /> },
    { key: "video", label: "Videos", icon: <Video className="h-3.5 w-3.5" /> },
  ];

  const activeUploads = uploads.filter((u) => u.status === "uploading");

  return (
    <div className="space-y-6">
      {/* ── Top header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and organise your images, videos, and documents.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMedia}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setShowUploadZone((v) => !v);
              setTimeout(() => uploadZoneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
            }}
          >
            <UploadCloud className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* ── Upload zone ──────────────────────────────────────────────────── */}
      {showUploadZone && (
        <div ref={uploadZoneRef} className="space-y-3">
          <MediaUploadZone
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropWrapper}
            onFiles={handleFiles}
            uploading={activeUploads.length > 0}
          />

          {uploads.length > 0 && (
            <div className="space-y-2">
              <UploadProgressList uploads={uploads} />
              {activeUploads.length === 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={clearUploads}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear completed
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Controls: search / filter / view toggle ──────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search files…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type filters */}
          <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/40">
            {filterButtons.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`
                  flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150
                  ${filterType === key
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                  }
                `}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/40">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-1.5 transition-all ${viewMode === "grid" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md p-1.5 transition-all ${viewMode === "list" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Count label ──────────────────────────────────────────────────── */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "file" : "files"}
          {search || filterType !== "all" ? " matching filters" : " total"}
        </p>
      )}

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {loading ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <MediaGridCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <MediaTableSkeleton />
        )
      ) : filtered.length === 0 ? (
        media.length === 0 ? (
          <MediaEmptyState onUploadClick={() => setShowUploadZone(true)} />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No files match your search</p>
            <p className="text-sm mt-1">Try different keywords or filters</p>
          </div>
        )
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <MediaGridCard
              key={item.id}
              item={item}
              onPreview={setPreviewItem}
              onCopy={handleCopy}
              onDelete={setDeleteTarget}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <MediaTable
          items={filtered}
          onPreview={setPreviewItem}
          onCopy={handleCopy}
          onDelete={setDeleteTarget}
          onSelect={onSelect}
        />
      )}

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <MediaPreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onCopy={handleCopy}
      />
      <DeleteConfirmModal
        item={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
