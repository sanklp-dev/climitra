"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Plus, Search, Package } from "lucide-react";

interface OrderRow {
  id: string;
  poNumber: string;
  supplierId: string;
  items: Array<{
    charcoalType: string;
    quantityTons: number;
    pricePerTon: number;
  }> | null;
  totalAmount: string | null;
  status: string | null;
  expectedDeliveryDate: string | null;
  createdAt: string;
  supplierName: string | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "closed", label: "Closed" },
];

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  draft: {
    className: "bg-gray-100 text-gray-800 border-gray-200",
    label: "Draft",
  },
  sent: {
    className: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Sent",
  },
  acknowledged: {
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
    label: "Acknowledged",
  },
  in_transit: {
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "In Transit",
  },
  delivered: {
    className: "bg-green-100 text-green-800 border-green-200",
    label: "Delivered",
  },
  closed: {
    className: "bg-gray-100 text-gray-600 border-gray-200",
    label: "Closed",
  },
};

function formatINR(amount: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getItemsSummary(
  items: Array<{
    charcoalType: string;
    quantityTons: number;
    pricePerTon: number;
  }> | null
): string {
  if (!items || items.length === 0) return "-";
  const totalQty = items.reduce((s, i) => s + i.quantityTons, 0);
  const types = [...new Set(items.map((i) => i.charcoalType))].join(", ");
  return `${types} (${totalQty}T)`;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage purchase orders and track deliveries
          </p>
        </div>
        <Button onClick={() => router.push("/orders/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expected Delivery</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex items-center justify-center text-muted-foreground">
                    Loading orders...
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-10 w-10" />
                    <p className="text-lg font-medium">No orders found</p>
                    <p className="text-sm">
                      Create your first purchase order to get started.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const style = STATUS_STYLES[order.status || "draft"];
                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-medium">
                      {order.poNumber}
                    </TableCell>
                    <TableCell>{order.supplierName || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {getItemsSummary(order.items)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {order.totalAmount
                        ? formatINR(Number(order.totalAmount))
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={style.className}>{style.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(order.expectedDeliveryDate)}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
