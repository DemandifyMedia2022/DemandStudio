"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdvertisementFilters } from "./advertisement-filters";
import { AdvertisementTable } from "./advertisement-table";
import { EditAdvertisementDrawer } from "./edit-advertisement-drawer";

export type Advertisement = {
  id: string;
  slotKey: string;
  slotDescription?: string;
  advertisementName?: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl?: string;
  redirectUrl?: string;
  openInNewTab: boolean;
  isActive: boolean;
  altText?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function AdvertisementClient() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  const fetchAdvertisements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/advertisements");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAdvertisements(data);
    } catch (error) {
      toast.error("Failed to load advertisements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvertisements();
  }, [fetchAdvertisements]);

  const handleUpdate = (updatedAd: Advertisement) => {
    setAdvertisements((prev) =>
      prev.map((ad) => (ad.slotKey === updatedAd.slotKey ? updatedAd : ad))
    );
  };

  const filtered = advertisements.filter((ad) => {
    const matchesSearch =
      !search ||
      ad.slotKey.toLowerCase().includes(search.toLowerCase()) ||
      (ad.advertisementName && ad.advertisementName.toLowerCase().includes(search.toLowerCase())) ||
      (ad.slotDescription && ad.slotDescription.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && ad.isActive) ||
      (statusFilter === "inactive" && !ad.isActive);

    const matchesType =
      mediaTypeFilter === "all" || ad.mediaType.toLowerCase() === mediaTypeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchAdvertisements} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <AdvertisementFilters
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        mediaTypeFilter={mediaTypeFilter}
        setMediaTypeFilter={setMediaTypeFilter}
      />

      <Card>
        <CardHeader>
          <CardTitle>Advertisement Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvertisementTable
            items={filtered}
            loading={loading}
            onEdit={setEditingAd}
          />
        </CardContent>
      </Card>

      <EditAdvertisementDrawer
        advertisement={editingAd}
        open={!!editingAd}
        onOpenChange={(open) => {
          if (!open) setEditingAd(null);
        }}
        onSaved={handleUpdate}
      />
    </div>
  );
}
