"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaSelectorDialog } from "@/components/media/media-selector-dialog";
import { uploadMediaFile } from "@/services/mediaService";
import { Advertisement } from "./advertisements-client";
import { ImageIcon, X, Upload } from "lucide-react";

interface EditAdvertisementDrawerProps {
  advertisement: Advertisement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (ad: Advertisement) => void;
}

export function EditAdvertisementDrawer({
  advertisement,
  open,
  onOpenChange,
  onSaved,
}: EditAdvertisementDrawerProps) {
  const [formData, setFormData] = useState<Partial<Advertisement>>({});
  const [saving, setSaving] = useState(false);
  const [mediaSelectorOpen, setMediaSelectorOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (advertisement) {
      setFormData(advertisement);
    }
  }, [advertisement]);

  const handleChange = (field: keyof Advertisement, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!advertisement?.slotKey) return;

    if (formData.isActive && !formData.mediaUrl) {
      toast.error("An active advertisement requires a media asset.");
      return;
    }

    if (formData.redirectUrl) {
      try {
        new URL(formData.redirectUrl);
      } catch (e) {
        toast.error("Please enter a valid Redirect URL (e.g., https://example.com).");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/advertisements/${advertisement.slotKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertisementName: formData.advertisementName,
          mediaType: formData.mediaType,
          mediaUrl: formData.mediaUrl,
          redirectUrl: formData.redirectUrl,
          openInNewTab: formData.openInNewTab,
          isActive: formData.isActive,
          altText: formData.altText,
        }),
      });

      if (!res.ok) throw new Error("Failed to save advertisement");

      const updatedAd = await res.json();
      toast.success("Advertisement updated successfully");
      onSaved(updatedAd);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update advertisement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Edit Advertisement Slot</SheetTitle>
          </SheetHeader>

          {advertisement && (
            <div className="space-y-6">
              {/* Read Only Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Slot Key</Label>
                  <Input value={advertisement.slotKey} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={advertisement.slotDescription || ""} disabled className="bg-muted" />
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Active Status</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable this advertisement.</p>
                  </div>
                  <Switch
                    checked={formData.isActive || false}
                    onCheckedChange={(val) => handleChange("isActive", val)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Advertisement Name</Label>
                  <Input
                    value={formData.advertisementName || ""}
                    onChange={(e) => handleChange("advertisementName", e.target.value)}
                    placeholder="e.g. Summer Sale Banner"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Media Type</Label>
                  <Select
                    value={formData.mediaType || "IMAGE"}
                    onValueChange={(val) => handleChange("mediaType", val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMAGE">Image</SelectItem>
                      <SelectItem value="VIDEO">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Asset</Label>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setMediaSelectorOpen(true)}>
                      <ImageIcon className="h-3.5 w-3.5 mr-1" />
                      Library
                    </Button>
                  </div>
                  
                  {formData.mediaUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
                      {formData.mediaType === "VIDEO" ? (
                        <video src={formData.mediaUrl} controls className="h-full w-full object-contain bg-black" />
                      ) : (
                        <img src={formData.mediaUrl} alt="Preview" className="h-full w-full object-cover" />
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => handleChange("mediaUrl", "")}
                        type="button"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-md bg-muted/50 relative overflow-hidden group hover:bg-muted transition-colors">
                      <div className="text-center space-y-2">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {uploading ? `Uploading... ${uploadProgress}%` : "Click or drag to upload media"}
                        </p>
                      </div>
                      <Input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          setUploading(true);
                          setUploadProgress(0);
                          try {
                            const item = await uploadMediaFile(
                              file,
                              "default", // organizationId
                              undefined, // projectId
                              (pct) => setUploadProgress(pct),
                              "advertisements" // folder
                            );
                            
                            handleChange("mediaUrl", item.url);
                            handleChange("mediaType", item.fileType.startsWith("video/") ? "VIDEO" : "IMAGE");
                            toast.success("Media uploaded successfully");
                          } catch (error) {
                            toast.error("Failed to upload media");
                          } finally {
                            setUploading(false);
                          }
                        }}
                        disabled={uploading}
                        accept={formData.mediaType === "VIDEO" ? "video/*" : "image/*"}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Alt Text</Label>
                  <Input
                    value={formData.altText || ""}
                    onChange={(e) => handleChange("altText", e.target.value)}
                    placeholder="Describe the media for screen readers..."
                  />
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label>Redirect URL</Label>
                  <Input
                    value={formData.redirectUrl || ""}
                    onChange={(e) => handleChange("redirectUrl", e.target.value)}
                    placeholder="https://example.com/promo"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Open link in new tab</Label>
                  <Switch
                    checked={formData.openInNewTab || false}
                    onCheckedChange={(val) => handleChange("openInNewTab", val)}
                  />
                </div>
              </div>
            </div>
          )}

          <SheetFooter className="mt-8 flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <MediaSelectorDialog
        organizationId="default"
        open={mediaSelectorOpen}
        onOpenChange={setMediaSelectorOpen}
        onSelect={(item) => {
          handleChange("mediaUrl", item.url);
          if (item.fileType.startsWith("video/")) {
            handleChange("mediaType", "VIDEO");
          } else {
            handleChange("mediaType", "IMAGE");
          }
        }}
      />
    </>
  );
}
