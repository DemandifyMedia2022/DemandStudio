"use client";

import { ImageIcon, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaEmptyStateProps {
  onUploadClick: () => void;
}

export function MediaEmptyState({ onUploadClick }: MediaEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <UploadCloud className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-xs">
        <h3 className="text-xl font-bold">No media yet</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upload images, videos, or PDFs to your media library. They'll appear here once uploaded.
        </p>
      </div>

      <Button onClick={onUploadClick} className="gap-2">
        <UploadCloud className="h-4 w-4" />
        Upload your first file
      </Button>
    </div>
  );
}
