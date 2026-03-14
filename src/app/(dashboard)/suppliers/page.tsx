"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ALL_STATES, LEAD_CATEGORIES } from "@/lib/geo/adjacency";
import type { Supplier } from "@/lib/db/schema";

const TIERS = ["preferred", "approved", "probation", "blacklisted"] as const;
const STATUSES = ["active", "pending_approval", "inactive"] as const;

function tierBadgeVariant(tier: string): "success" | "default" | "warning" | "destructive" {
  switch (tier) {
    case "preferred":
      return "success";
    case "approved":
      return "default";
    case "probation":
      return "warning";
    case "blacklisted":
      return "destructive";
    default:
      return "default";
  }
}

function statusBadgeVariant(status: string): "success" | "secondary" | "destructive" {
  switch (status) {
    case "active":
      return "success";
    case "pending_approval":
      return "secondary";
    case "inactive":
      return "destructive";
    default:
      return "secondary";
  }
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null || rating === undefined) {
    return <span className="text-muted-foreground text-sm">N/A</span>;
  }
  const numRating = Number(rating);
  const fullStars = Math.floor(numRating);
  const hasHalf = numRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg key={`full-${i}`} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      {hasHalf && (
        <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="halfGrad">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path
            fill="url(#halfGrad)"
            d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
          />
        </svg>
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300 fill-current" viewBox="0 0 20 20">
          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-muted-foreground">{numRating.toFixed(1)}</span>
    </div>
  );
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [includeAdjacent, setIncludeAdjacent] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
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
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/suppliers?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setSuppliers(data.suppliers);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter, categoryFilter, tierFilter, statusFilter, includeAdjacent, page]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, stateFilter, categoryFilter, tierFilter, statusFilter, includeAdjacent]);

  function getCategoryLabel(value: string): string {
    const cat = LEAD_CATEGORIES.find((c) => c.value === value);
    return cat ? cat.label : value;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">
            Manage your supplier network. {total} supplier{total !== 1 ? "s" : ""} found.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/suppliers/map")}>
            Map View
          </Button>
          <Button onClick={() => router.push("/suppliers/new")}>
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name, owner, phone, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All States</option>
          {ALL_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-56"
        >
          <option value="">All Categories</option>
          {LEAD_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>

        <Select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="w-40"
        >
          <option value="">All Tiers</option>
          {TIERS.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </Select>

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </Select>

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
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business Name</TableHead>
              <TableHead>State / District</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Capacity (t/mo)</TableHead>
              <TableHead>Price/ton</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading suppliers...
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No suppliers found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/suppliers/${supplier.id}`)}
                >
                  <TableCell className="font-medium">
                    {supplier.businessName}
                    {supplier.ownerName && (
                      <span className="block text-xs text-muted-foreground">
                        {supplier.ownerName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.state}
                    {supplier.district && (
                      <span className="block text-xs text-muted-foreground">
                        {supplier.district}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(supplier.leadCategories as string[] | null)?.map((cat) => (
                        <span
                          key={cat}
                          className="inline-block text-xs bg-blue-50 text-blue-700 rounded px-1.5 py-0.5"
                        >
                          {getCategoryLabel(cat)}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {supplier.capacityTonsPerMonth
                      ? Number(supplier.capacityTonsPerMonth).toFixed(1)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {supplier.pricePerTon
                      ? `₹${Number(supplier.pricePerTon).toLocaleString("en-IN")}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={tierBadgeVariant(supplier.tier || "approved")}>
                      {supplier.tier || "approved"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <RatingStars rating={supplier.internalRating ? Number(supplier.internalRating) : null} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(supplier.status || "active")}>
                      {(supplier.status || "active").replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
