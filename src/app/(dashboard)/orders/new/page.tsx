"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react";

interface Supplier {
  id: string;
  businessName: string;
  ownerName: string | null;
  state: string;
  phone: string | null;
}

interface OrderItem {
  charcoalType: string;
  quantityTons: number;
  pricePerTon: number;
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function NewOrderPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { charcoalType: "", quantityTons: 0, pricePerTon: 0 },
  ]);
  const [paymentTerms, setPaymentTerms] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const res = await fetch("/api/suppliers");
        if (res.ok) {
          const data = await res.json();
          // Handle both array response and paginated response
          const supplierList = Array.isArray(data) ? data : data.suppliers || data.data || [];
          setSuppliers(supplierList);
        }
      } catch (err) {
        console.error("Failed to fetch suppliers:", err);
      } finally {
        setLoadingSuppliers(false);
      }
    }
    fetchSuppliers();
  }, []);

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, [field]: value };
      })
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { charcoalType: "", quantityTons: 0, pricePerTon: 0 },
    ]);
  }

  function removeItem(index: number) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function getLineTotal(item: OrderItem): number {
    return item.quantityTons * item.pricePerTon;
  }

  function getTotalAmount(): number {
    return items.reduce((sum, item) => sum + getLineTotal(item), 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validation
    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    const validItems = items.filter(
      (item) =>
        item.charcoalType.trim() &&
        item.quantityTons > 0 &&
        item.pricePerTon > 0
    );

    if (validItems.length === 0) {
      setError(
        "Please add at least one item with charcoal type, quantity, and price."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId,
          items: validItems,
          paymentTerms: paymentTerms.trim() || null,
          expectedDeliveryDate: expectedDeliveryDate || null,
        }),
      });

      if (res.ok) {
        const newOrder = await res.json();
        router.push(`/orders/${newOrder.id}`);
      } else {
        const errData = await res.json();
        setError(errData.error || "Failed to create order.");
      }
    } catch (err) {
      console.error("Failed to create order:", err);
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Purchase Order
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details to create a new purchase order
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Supplier Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supplier</CardTitle>
            <CardDescription>
              Select the supplier for this purchase order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full max-w-md"
              disabled={loadingSuppliers}
            >
              <option value="">
                {loadingSuppliers
                  ? "Loading suppliers..."
                  : "Select a supplier"}
              </option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.businessName}
                  {supplier.state ? ` - ${supplier.state}` : ""}
                </option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {/* Items Builder */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Order Items</CardTitle>
                <CardDescription>
                  Add charcoal items with quantity and pricing
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Charcoal Type</TableHead>
                    <TableHead className="w-[150px]">Qty (Tons)</TableHead>
                    <TableHead className="w-[180px]">Price/Ton (INR)</TableHead>
                    <TableHead className="text-right w-[150px]">
                      Line Total
                    </TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          placeholder="e.g., Lump Charcoal, Briquettes"
                          value={item.charcoalType}
                          onChange={(e) =>
                            updateItem(index, "charcoalType", e.target.value)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0"
                          value={item.quantityTons || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantityTons",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="0"
                          value={item.pricePerTon || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "pricePerTon",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {getLineTotal(item) > 0
                          ? formatINR(getLineTotal(item))
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={3} className="text-right font-semibold">
                      Total Amount
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {getTotalAmount() > 0 ? formatINR(getTotalAmount()) : "-"}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Payment Terms
              </label>
              <Textarea
                placeholder="e.g., 50% advance, 50% on delivery. Net 30 days."
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Expected Delivery Date
              </label>
              <Input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={submitting} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {submitting ? "Creating Order..." : "Create Purchase Order"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.push("/orders")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
