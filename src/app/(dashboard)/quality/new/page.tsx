"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Order {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string | null;
  status: string;
}

export default function NewQualityTestPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPO, setSelectedPO] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [fixedCarbonPct, setFixedCarbonPct] = useState("");
  const [moisturePct, setMoisturePct] = useState("");
  const [ashPct, setAshPct] = useState("");
  const [volatilePct, setVolatilePct] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchDeliveredOrders();
  }, []);

  async function fetchDeliveredOrders() {
    try {
      const res = await fetch("/api/orders?status=delivered");
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
    } else {
      setSupplierId("");
      setSupplierName("");
    }
  }

  function getResult(): "pass" | "fail" | null {
    const fc = parseFloat(fixedCarbonPct);
    const mc = parseFloat(moisturePct);
    const ac = parseFloat(ashPct);

    if (isNaN(fc) || isNaN(mc) || isNaN(ac)) return null;

    return fc >= 65 && mc <= 12 && ac <= 8 ? "pass" : "fail";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPO || !supplierId) return;

    setLoading(true);
    try {
      const res = await fetch("/api/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseOrderId: selectedPO,
          supplierId,
          fixedCarbonPct: fixedCarbonPct || null,
          moisturePct: moisturePct || null,
          ashPct: ashPct || null,
          volatilePct: volatilePct || null,
          notes,
        }),
      });

      if (res.ok) {
        router.push("/quality");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create quality test");
      }
    } catch (error) {
      console.error("Failed to create quality test:", error);
      alert("Failed to create quality test");
    } finally {
      setLoading(false);
    }
  }

  const previewResult = getResult();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/quality">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Record Quality Test
          </h1>
          <p className="text-muted-foreground">
            Record quality parameters for a delivered purchase order
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="h-5 w-5" />
                Test Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Purchase Order *
                  </label>
                  <Select
                    value={selectedPO}
                    onChange={(e) => handlePOChange(e.target.value)}
                    required
                  >
                    <option value="">Select a delivered PO</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.poNumber} - {order.supplierName}
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Fixed Carbon %
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 72.50"
                      value={fixedCarbonPct}
                      onChange={(e) => setFixedCarbonPct(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pass threshold: &ge; 65%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Moisture %</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 8.20"
                      value={moisturePct}
                      onChange={(e) => setMoisturePct(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pass threshold: &le; 12%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ash %</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 5.00"
                      value={ashPct}
                      onChange={(e) => setAshPct(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pass threshold: &le; 8%
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Volatile Matter %
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g., 22.00"
                      value={volatilePct}
                      onChange={(e) => setVolatilePct(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Textarea
                    placeholder="Any observations or remarks about the test..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading || !selectedPO}>
                    {loading ? "Submitting..." : "Record Test"}
                  </Button>
                  <Link href="/quality">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Result Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewResult === null ? (
                <p className="text-sm text-muted-foreground">
                  Enter Fixed Carbon, Moisture, and Ash percentages to see the
                  auto-calculated result.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Result:</span>
                    {previewResult === "pass" ? (
                      <Badge variant="success" className="text-sm">
                        PASS
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-sm">
                        FAIL
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 rounded-md border p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Fixed Carbon</span>
                      <span
                        className={
                          parseFloat(fixedCarbonPct) >= 65
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {fixedCarbonPct}%{" "}
                        {parseFloat(fixedCarbonPct) >= 65 ? "(OK)" : "(LOW)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Moisture</span>
                      <span
                        className={
                          parseFloat(moisturePct) <= 12
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {moisturePct}%{" "}
                        {parseFloat(moisturePct) <= 12 ? "(OK)" : "(HIGH)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ash</span>
                      <span
                        className={
                          parseFloat(ashPct) <= 8
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {ashPct}%{" "}
                        {parseFloat(ashPct) <= 8 ? "(OK)" : "(HIGH)"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Pass criteria: Fixed Carbon &ge; 65%, Moisture &le; 12%, Ash
                    &le; 8%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
