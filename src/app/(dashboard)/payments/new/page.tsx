"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, ArrowLeft } from "lucide-react";

interface Order {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string | null;
  totalAmount: string | null;
  status: string;
}

export default function NewPaymentPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPO, setSelectedPO] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  }

  function handlePOChange(poId: string) {
    setSelectedPO(poId);
    const order = orders.find((o) => o.id === poId);
    if (order) {
      setSupplierId(order.supplierId);
      setSupplierName(order.supplierName || "Unknown");
      setPoAmount(order.totalAmount || "0");
    } else {
      setSupplierId("");
      setSupplierName("");
      setPoAmount("");
    }
  }

  function formatCurrency(amount: string) {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPO || !supplierId || !amount) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: selectedPO,
          supplierId,
          amount: parseFloat(amount),
          paymentDate: paymentDate || null,
          paymentMode: paymentMode || null,
          status,
          notes,
        }),
      });

      if (res.ok) {
        router.push("/payments");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create payment");
      }
    } catch (error) {
      console.error("Failed to create payment:", error);
      alert("Failed to create payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/payments">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
          <p className="text-muted-foreground">
            Record a payment for a purchase order
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Order *</label>
                <Select
                  value={selectedPO}
                  onChange={(e) => handlePOChange(e.target.value)}
                  required
                >
                  <option value="">Select a purchase order</option>
                  {orders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.poNumber} - {order.supplierName} (
                      {formatCurrency(order.totalAmount || "0")})
                    </option>
                  ))}
                </Select>
              </div>

              {supplierName && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supplier</label>
                  <Input value={supplierName} disabled />
                </div>
              )}

              {poAmount && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <p className="text-sm text-blue-800">
                    PO Total Amount:{" "}
                    <span className="font-semibold">
                      {formatCurrency(poAmount)}
                    </span>
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount (INR) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter payment amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Date</label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Mode</label>
                  <Select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="">Select payment mode</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  placeholder="Add any payment remarks or reference details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={loading || !selectedPO || !amount}
                >
                  {loading ? "Submitting..." : "Record Payment"}
                </Button>
                <Link href="/payments">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
