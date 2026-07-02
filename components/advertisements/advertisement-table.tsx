"use client";

import { Advertisement } from "./advertisements-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, ImageIcon, Video } from "lucide-react";
import { format } from "date-fns";

interface AdvertisementTableProps {
  items: Advertisement[];
  loading: boolean;
  onEdit: (ad: Advertisement) => void;
}

export function AdvertisementTable({ items, loading, onEdit }: AdvertisementTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Preview</TableHead>
          <TableHead>Advertisement</TableHead>
          <TableHead>Slot Key</TableHead>
          <TableHead>Media Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
              Loading advertisements...
            </TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
              No advertisements found.
            </TableCell>
          </TableRow>
        ) : (
          items.map((ad) => (
            <TableRow key={ad.id}>
              <TableCell>
                {ad.mediaUrl ? (
                  ad.mediaType === "IMAGE" ? (
                    <div className="w-20 h-12 rounded overflow-hidden bg-muted flex items-center justify-center border shadow-sm">
                      <img src={ad.mediaUrl} alt={ad.altText || ""} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-12 rounded bg-muted flex items-center justify-center border shadow-sm">
                      <Video className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )
                ) : (
                  <div className="w-20 h-12 rounded bg-muted/50 border border-dashed flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Empty</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{ad.advertisementName || "Unnamed Ad"}</span>
                  <span className="text-xs text-muted-foreground">{ad.slotDescription}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {ad.slotKey}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {ad.mediaType === "IMAGE" ? <ImageIcon className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                  <span className="capitalize">{ad.mediaType.toLowerCase()}</span>
                </div>
              </TableCell>
              <TableCell>
                {ad.isActive ? (
                  <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </TableCell>
              <TableCell className="text-gray-500 text-sm">
                {format(new Date(ad.updatedAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(ad)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
