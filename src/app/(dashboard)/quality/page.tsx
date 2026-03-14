"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FlaskConical, Plus } from "lucide-react";

interface QualityTest {
  id: string;
  purchaseOrderId: string;
  supplierId: string;
  fixedCarbonPct: string | null;
  moisturePct: string | null;
  ashPct: string | null;
  volatilePct: string | null;
  result: "pass" | "fail" | null;
  notes: string | null;
  testedAt: string | null;
  createdAt: string;
  poNumber: string | null;
  supplierName: string | null;
}

interface Supplier {
  id: string;
  businessName: string;
}

export default function QualityTestsPage() {
  const [tests, setTests] = useState<QualityTest[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState("all");
  const [filterSupplier, setFilterSupplier] = useState("all");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    fetchTests();
  }, [filterResult, filterSupplier]);

  async function fetchSuppliers() {
    try {
      const res = await fetch("/api/suppliers?limit=200");
      if (!res.ok) return;
      const data = await res.json();
      setSuppliers(
        (data.suppliers || []).map((s: { id: string; businessName: string }) => ({
          id: s.id,
          businessName: s.businessName,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch suppliers:", error);
    }
  }

  async function fetchTests() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterResult !== "all") params.set("result", filterResult);
      if (filterSupplier !== "all") params.set("supplierId", filterSupplier);

      const res = await fetch(`/api/quality?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setTests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch quality tests:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quality Tests</h1>
          <p className="text-muted-foreground">
            Track and manage quality testing results for deliveries
          </p>
        </div>
        <Link href="/quality/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Test
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <Select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
          >
            <option value="all">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
          </Select>
        </div>
        <div className="w-64">
          <Select
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
          >
            <option value="all">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-5 w-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading quality tests...</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FlaskConical className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No quality tests found</p>
              <p className="text-muted-foreground">
                Record a new quality test to get started
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test ID</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Fixed Carbon %</TableHead>
                  <TableHead className="text-right">Moisture %</TableHead>
                  <TableHead className="text-right">Ash %</TableHead>
                  <TableHead className="text-right">Volatile %</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Test Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="font-mono text-xs">
                      {test.id.slice(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {test.poNumber || "-"}
                    </TableCell>
                    <TableCell>{test.supplierName || "-"}</TableCell>
                    <TableCell className="text-right">
                      {test.fixedCarbonPct ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {test.moisturePct ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {test.ashPct ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {test.volatilePct ?? "-"}
                    </TableCell>
                    <TableCell>
                      {test.result === "pass" ? (
                        <Badge variant="success">Pass</Badge>
                      ) : test.result === "fail" ? (
                        <Badge variant="destructive">Fail</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(test.testedAt)}</TableCell>
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
