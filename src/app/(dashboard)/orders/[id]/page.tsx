"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Truck,
  CheckCircle2,
  Send,
  HandshakeIcon,
  PackageCheck,
  Lock,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
} from "lucide-react";

interface OrderDetail {
  id: string;
  poNumber: string;
  supplierId: string;
  createdBy: string;
  items: Array<{
    charcoalType: string;
    quantityTons: number;
    pricePerTon: number;
  }> | null;
  totalAmount: string | null;
  paymentTerms: string | null;
  status: string | null;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  transporterDetails: string | null;
  vehicleNumber: string | null;
  lrNumber: string | null;
  quantityReceived: string | null;
  createdAt: string;
  updatedAt: string;
  supplierName: string | null;
  supplierPhone: string | null;
  supplierEmail: string | null;
  supplierState: string | null;
  supplierDistrict: string | null;
  supplierAddress: string | null;
  supplierOwnerName: string | null;
}

const ALL_STATUSES = [
  "draft",
  "sent",
  "acknowledged",
  "in_transit",
  "delivered",
  "closed",
] as const;

const STATUS_CONFIG: Record<
  string,
  { className: string; label: string; icon: React.ElementType }
> = {
  draft: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Draft", icon: CheckCircle2 },
  sent: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Sent", icon: Send },
  acknowledged: { className: "bg-indigo-100 text-indigo-800 border-indigo-200", label: "Acknowledged", icon: HandshakeIcon },
  in_transit: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "In Transit", icon: Truck },
  delivered: { className: "bg-green-100 text-green-800 border-green-200", label: "Delivered", icon: PackageCheck },
  closed: { className: "bg-gray-100 text-gray-600 border-gray-200", label: "Closed", icon: Lock },
};

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Dialog states
  const [transitDialogOpen, setTransitDialogOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [editDeliveryDialogOpen, setEditDeliveryDialogOpen] = useState(false);

  // Transit form
  const [transporterDetails, setTransporterDetails] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [lrNumber, setLrNumber] = useState("");

  // Delivery form
  const [actualDeliveryDate, setActualDeliveryDate] = useState("");
  const [quantityReceived, setQuantityReceived] = useState("");

  // Edit delivery form
  const [editTransporter, setEditTransporter] = useState("");
  const [editVehicle, setEditVehicle] = useState("");
  const [editLr, setEditLr] = useState("");
  const [editActualDate, setEditActualDate] = useState("");
  const [editQuantity, setEditQuantity] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Failed to fetch order:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  async function updateOrder(data: Record<string, unknown>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchOrder();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to update order:", error);
      return false;
    } finally {
      setUpdating(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    await updateOrder({ status: newStatus });
  }

  async function handleMarkInTransit() {
    const success = await updateOrder({
      status: "in_transit",
      transporterDetails,
      vehicleNumber,
      lrNumber,
    });
    if (success) {
      setTransitDialogOpen(false);
      setTransporterDetails("");
      setVehicleNumber("");
      setLrNumber("");
    }
  }

  async function handleMarkDelivered() {
    const success = await updateOrder({
      status: "delivered",
      actualDeliveryDate: actualDeliveryDate || null,
      quantityReceived: quantityReceived || null,
    });
    if (success) {
      setDeliveryDialogOpen(false);
      setActualDeliveryDate("");
      setQuantityReceived("");
    }
  }

  async function handleEditDelivery() {
    const success = await updateOrder({
      transporterDetails: editTransporter,
      vehicleNumber: editVehicle,
      lrNumber: editLr,
      actualDeliveryDate: editActualDate || null,
      quantityReceived: editQuantity || null,
    });
    if (success) {
      setEditDeliveryDialogOpen(false);
    }
  }

  function openEditDeliveryDialog() {
    setEditTransporter(order?.transporterDetails || "");
    setEditVehicle(order?.vehicleNumber || "");
    setEditLr(order?.lrNumber || "");
    setEditActualDate(
      order?.actualDeliveryDate
        ? new Date(order.actualDeliveryDate).toISOString().split("T")[0]
        : ""
    );
    setEditQuantity(order?.quantityReceived || "");
    setEditDeliveryDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-lg text-muted-foreground">Order not found</p>
        <Button variant="outline" onClick={() => router.push("/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStatus = order.status || "draft";
  const statusStyle = STATUS_CONFIG[currentStatus];
  const currentStatusIndex = ALL_STATUSES.indexOf(
    currentStatus as (typeof ALL_STATUSES)[number]
  );

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">
              {order.poNumber}
            </h1>
            <Badge className={statusStyle.className}>{statusStyle.label}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Created on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {ALL_STATUSES.map((status, index) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const isActive = index <= currentStatusIndex;
              const isCurrent = status === currentStatus;
              return (
                <div key={status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isCurrent
                          ? "text-primary"
                          : isActive
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {config.label}
                    </span>
                  </div>
                  {index < ALL_STATUSES.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 mt-[-18px] ${
                        index < currentStatusIndex
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Charcoal Type</TableHead>
                      <TableHead className="text-right">Qty (Tons)</TableHead>
                      <TableHead className="text-right">Price/Ton</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {item.charcoalType}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantityTons}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatINR(item.pricePerTon)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatINR(item.quantityTons * item.pricePerTon)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center text-muted-foreground py-6"
                        >
                          No items
                        </TableCell>
                      </TableRow>
                    )}
                    {order.items && order.items.length > 0 && (
                      <TableRow className="bg-muted/30 font-semibold">
                        <TableCell colSpan={3} className="text-right">
                          Total Amount
                        </TableCell>
                        <TableCell className="text-right">
                          {order.totalAmount
                            ? formatINR(Number(order.totalAmount))
                            : "-"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {order.paymentTerms && (
                <div className="mt-4 p-3 rounded-md bg-muted/30">
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Payment Terms
                  </p>
                  <p className="text-sm">{order.paymentTerms}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Delivery Information</CardTitle>
                <CardDescription>
                  Transport and delivery details
                </CardDescription>
              </div>
              {(currentStatus === "in_transit" ||
                currentStatus === "delivered" ||
                currentStatus === "closed") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openEditDeliveryDialog}
                >
                  Edit Details
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Expected Delivery
                  </p>
                  <p className="font-medium">
                    {formatDate(order.expectedDeliveryDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Actual Delivery
                  </p>
                  <p className="font-medium">
                    {formatDate(order.actualDeliveryDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transporter</p>
                  <p className="font-medium">
                    {order.transporterDetails || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Vehicle Number
                  </p>
                  <p className="font-medium">{order.vehicleNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LR Number</p>
                  <p className="font-medium">{order.lrNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Quantity Received
                  </p>
                  <p className="font-medium">
                    {order.quantityReceived
                      ? `${order.quantityReceived} Tons`
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {order.supplierName || "Unknown"}
                  </p>
                  {order.supplierOwnerName && (
                    <p className="text-sm text-muted-foreground">
                      {order.supplierOwnerName}
                    </p>
                  )}
                </div>
              </div>
              {order.supplierPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.supplierPhone}</span>
                </div>
              )}
              {order.supplierEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{order.supplierEmail}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm">
                  {[
                    order.supplierAddress,
                    order.supplierDistrict,
                    order.supplierState,
                  ]
                    .filter(Boolean)
                    .join(", ") || "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentStatus === "draft" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("sent")}
                  disabled={updating}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {updating ? "Updating..." : "Send to Supplier"}
                </Button>
              )}
              {currentStatus === "sent" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("acknowledged")}
                  disabled={updating}
                >
                  <HandshakeIcon className="mr-2 h-4 w-4" />
                  {updating ? "Updating..." : "Mark Acknowledged"}
                </Button>
              )}
              {currentStatus === "acknowledged" && (
                <Button
                  className="w-full"
                  onClick={() => setTransitDialogOpen(true)}
                  disabled={updating}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Mark In Transit
                </Button>
              )}
              {currentStatus === "in_transit" && (
                <Button
                  className="w-full"
                  onClick={() => setDeliveryDialogOpen(true)}
                  disabled={updating}
                >
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Mark Delivered
                </Button>
              )}
              {currentStatus === "delivered" && (
                <Button
                  className="w-full"
                  onClick={() => handleStatusChange("closed")}
                  disabled={updating}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {updating ? "Updating..." : "Close Order"}
                </Button>
              )}
              {currentStatus === "closed" && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  This order has been closed.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Items</span>
                <span className="font-medium">
                  {order.items?.length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Quantity</span>
                <span className="font-medium">
                  {order.items
                    ? `${order.items.reduce(
                        (s, i) => s + i.quantityTons,
                        0
                      )} Tons`
                    : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground font-medium">
                  Total Amount
                </span>
                <span className="font-bold text-lg">
                  {order.totalAmount
                    ? formatINR(Number(order.totalAmount))
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* In Transit Dialog */}
      <Dialog
        open={transitDialogOpen}
        onClose={() => setTransitDialogOpen(false)}
      >
        <DialogHeader>
          <DialogTitle>Mark as In Transit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Transporter Name / Details
            </label>
            <Input
              placeholder="Enter transporter name or details"
              value={transporterDetails}
              onChange={(e) => setTransporterDetails(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Vehicle Number
            </label>
            <Input
              placeholder="e.g., MH 12 AB 1234"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              LR Number
            </label>
            <Input
              placeholder="Lorry receipt number"
              value={lrNumber}
              onChange={(e) => setLrNumber(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setTransitDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleMarkInTransit} disabled={updating}>
            {updating ? "Updating..." : "Confirm In Transit"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Delivery Dialog */}
      <Dialog
        open={deliveryDialogOpen}
        onClose={() => setDeliveryDialogOpen(false)}
      >
        <DialogHeader>
          <DialogTitle>Mark as Delivered</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Actual Delivery Date
            </label>
            <Input
              type="date"
              value={actualDeliveryDate}
              onChange={(e) => setActualDeliveryDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Quantity Received (Tons)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter quantity received"
              value={quantityReceived}
              onChange={(e) => setQuantityReceived(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeliveryDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleMarkDelivered} disabled={updating}>
            {updating ? "Updating..." : "Confirm Delivery"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Delivery Details Dialog */}
      <Dialog
        open={editDeliveryDialogOpen}
        onClose={() => setEditDeliveryDialogOpen(false)}
      >
        <DialogHeader>
          <DialogTitle>Edit Delivery Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Transporter Name / Details
            </label>
            <Input
              placeholder="Enter transporter name or details"
              value={editTransporter}
              onChange={(e) => setEditTransporter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Vehicle Number
            </label>
            <Input
              placeholder="e.g., MH 12 AB 1234"
              value={editVehicle}
              onChange={(e) => setEditVehicle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              LR Number
            </label>
            <Input
              placeholder="Lorry receipt number"
              value={editLr}
              onChange={(e) => setEditLr(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Actual Delivery Date
            </label>
            <Input
              type="date"
              value={editActualDate}
              onChange={(e) => setEditActualDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Quantity Received (Tons)
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="Enter quantity received"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setEditDeliveryDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleEditDelivery} disabled={updating}>
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
