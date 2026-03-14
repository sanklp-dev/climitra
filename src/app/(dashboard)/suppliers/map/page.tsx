"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ALL_STATES, LEAD_CATEGORIES } from "@/lib/geo/adjacency";
import type { Supplier } from "@/lib/db/schema";

const SupplierMap = dynamic(() => import("@/components/maps/supplier-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[500px] bg-muted/30 rounded-lg">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

const TIERS = ["preferred", "approved", "probation", "blacklisted"] as const;
const STATUSES = ["active", "pending_approval", "inactive"] as const;

const TIER_COLORS: Record<string, string> = {
  preferred: "#22c55e",
  approved: "#3b82f6",
  probation: "#eab308",
  blacklisted: "#ef4444",
};

export default function SupplierMapPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [includeAdjacent, setIncludeAdjacent] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (stateFilter) params.set("state", stateFilter);
      if (categoryFilter) params.set("leadCategory", categoryFilter);
      if (tierFilter) params.set("tier", tierFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (includeAdjacent && stateFilter) params.set("includeAdjacent", "true");
      params.set("limit", "500"); // Fetch more for map view

      const res = await fetch(`/api/suppliers?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();

      setSuppliers(data.suppliers || []);
      setTotal(data.pagination?.total ?? 0);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter, categoryFilter, tierFilter, statusFilter, includeAdjacent]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const suppliersWithCoords = suppliers.filter(
    (s) => s.lat && s.lng && Number(s.lat) !== 0 && Number(s.lng) !== 0
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Map</h1>
          <p className="text-muted-foreground mt-1">
            {suppliersWithCoords.length} of {total} supplier{total !== 1 ? "s" : ""} shown on map
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/suppliers")}>
            List View
          </Button>
          <Button onClick={() => router.push("/suppliers/new")}>
            Add Supplier
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Filter Panel */}
        <div className="w-72 shrink-0 space-y-4 overflow-y-auto border rounded-lg p-4 bg-card">
          <h3 className="font-semibold text-sm">Filters</h3>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Search</label>
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">State</label>
            <Select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="text-sm"
            >
              <option value="">All States</option>
              {ALL_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>

          {stateFilter && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeAdjacent}
                onChange={(e) => setIncludeAdjacent(e.target.checked)}
                className="rounded border-gray-300"
              />
              Include adjacent states
            </label>
          )}

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm"
            >
              <option value="">All Categories</option>
              {LEAD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Tier</label>
            <Select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="text-sm"
            >
              <option value="">All Tiers</option>
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </Select>
          </div>

          {/* Legend */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-xs text-muted-foreground mb-2">Tier Legend</h4>
            <div className="space-y-2">
              {TIERS.map((tier) => (
                <div key={tier} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: TIER_COLORS[tier] }}
                  />
                  <span>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="border-t pt-4">
            <h4 className="font-semibold text-xs text-muted-foreground mb-2">Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <Badge variant="secondary">{total}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">On map</span>
                <Badge variant="secondary">{suppliersWithCoords.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">No coordinates</span>
                <Badge variant="outline">{total - suppliersWithCoords.length}</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 rounded-lg overflow-hidden border">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-muted/30">
              <p className="text-muted-foreground">Loading suppliers...</p>
            </div>
          ) : (
            <SupplierMap suppliers={suppliers} />
          )}
        </div>
      </div>
    </div>
  );
}
