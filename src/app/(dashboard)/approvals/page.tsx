"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LEAD_CATEGORIES } from "@/lib/geo/adjacency";

interface Supplier {
  id: string;
  businessName: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  state: string;
  district: string | null;
  leadCategories: string[] | null;
  capacityTonsPerMonth: string | null;
  charcoalType: string | null;
  form: string | null;
  source: string;
  status: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {};
for (const cat of LEAD_CATEGORIES) {
  categoryLabels[cat.value] = cat.label;
}

export default function ApprovalsPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingSuppliers = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/suppliers?status=pending_approval&limit=100");
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch pending approvals");
        return;
      }

      setSuppliers(data.suppliers || []);
    } catch {
      setError("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingSuppliers();
  }, [fetchPendingSuppliers]);

  async function handleAction(supplierId: string, action: "approve" | "reject") {
    setActionLoading(supplierId);
    try {
      const response = await fetch("/api/suppliers/approve", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: supplierId, action }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || `Failed to ${action} supplier`);
        return;
      }

      // Remove the supplier from the list after action
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
    } catch {
      setError(`Failed to ${action} supplier`);
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getCategoryLabels(categories: string[] | null) {
    if (!categories || categories.length === 0) return "N/A";
    return categories
      .map((c) => categoryLabels[c] || c)
      .join(", ");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supplier Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve pending supplier registrations
          </p>
        </div>
        <Badge variant="warning" className="text-sm px-3 py-1">
          {suppliers.length} Pending
        </Badge>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Approvals</CardTitle>
          <CardDescription>
            Suppliers awaiting review. Approve to activate or reject to deactivate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading pending approvals...</div>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-4xl mb-3">--</div>
              <h3 className="text-lg font-medium">No Pending Approvals</h3>
              <p className="text-muted-foreground mt-1">
                All supplier registrations have been reviewed.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      {supplier.businessName}
                    </TableCell>
                    <TableCell>{supplier.ownerName || "N/A"}</TableCell>
                    <TableCell>{supplier.state}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate text-sm" title={getCategoryLabels(supplier.leadCategories)}>
                        {getCategoryLabels(supplier.leadCategories)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {supplier.capacityTonsPerMonth
                        ? `${supplier.capacityTonsPerMonth} t/m`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {supplier.source?.replace("_", " ") || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(supplier.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAction(supplier.id, "approve")}
                          disabled={actionLoading === supplier.id}
                        >
                          {actionLoading === supplier.id ? "..." : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(supplier.id, "reject")}
                          disabled={actionLoading === supplier.id}
                        >
                          {actionLoading === supplier.id ? "..." : "Reject"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
