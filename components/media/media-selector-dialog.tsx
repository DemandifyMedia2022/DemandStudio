"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaLibraryClient } from "@/components/media/MediaLibraryClient";
import { MediaItem } from "@/services/mediaService";

interface MediaSelectorDialogProps {
  organizationId: string;
  projectId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: MediaItem) => void;
}

export function MediaSelectorDialog({
  organizationId,
  projectId,
  open,
  onOpenChange,
  onSelect,
}: MediaSelectorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto p-6 bg-muted/10">
          <MediaLibraryClient
            organizationId={organizationId}
            projectId={projectId}
            onSelect={(item) => {
              onSelect(item);
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
