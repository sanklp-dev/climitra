import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { qualityTests, purchaseOrders, suppliers } from "@/lib/db/schema";
import { eq, desc, and, SQL } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/api-guard";

function parsePercentage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const result = searchParams.get("result");
    const supplierId = searchParams.get("supplierId");

    const conditions: SQL[] = [];

    if (result && (result === "pass" || result === "fail")) {
      conditions.push(eq(qualityTests.result, result));
    }

    if (supplierId) {
      conditions.push(eq(qualityTests.supplierId, supplierId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const tests = await db
      .select({
        id: qualityTests.id,
        purchaseOrderId: qualityTests.purchaseOrderId,
        supplierId: qualityTests.supplierId,
        fixedCarbonPct: qualityTests.fixedCarbonPct,
        moisturePct: qualityTests.moisturePct,
        ashPct: qualityTests.ashPct,
        volatilePct: qualityTests.volatilePct,
        result: qualityTests.result,
        notes: qualityTests.notes,
        testedBy: qualityTests.testedBy,
        testedAt: qualityTests.testedAt,
        weighbridgeSlipUrl: qualityTests.weighbridgeSlipUrl,
        createdAt: qualityTests.createdAt,
        poNumber: purchaseOrders.poNumber,
        supplierName: suppliers.businessName,
      })
      .from(qualityTests)
      .leftJoin(purchaseOrders, eq(qualityTests.purchaseOrderId, purchaseOrders.id))
      .leftJoin(suppliers, eq(qualityTests.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(desc(qualityTests.createdAt));

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Failed to fetch quality tests:", error);
    return NextResponse.json(
      { error: "Failed to fetch quality tests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const {
      purchaseOrderId,
      supplierId,
      fixedCarbonPct,
      moisturePct,
      ashPct,
      volatilePct,
      notes,
    } = body;

    if (!purchaseOrderId || !supplierId) {
      return NextResponse.json(
        { error: "Purchase order and supplier are required" },
        { status: 400 }
      );
    }

    const fc = parsePercentage(fixedCarbonPct);
    const mc = parsePercentage(moisturePct);
    const ac = parsePercentage(ashPct);
    const vc = parsePercentage(volatilePct);

    if (fc === null || mc === null || ac === null) {
      return NextResponse.json(
        {
          error:
            "Fixed carbon, moisture, and ash percentages are required and must be between 0 and 100",
        },
        { status: 400 }
      );
    }

    if (
      volatilePct !== undefined &&
      volatilePct !== null &&
      volatilePct !== "" &&
      vc === null
    ) {
      return NextResponse.json(
        { error: "Volatile matter percentage must be between 0 and 100" },
        { status: 400 }
      );
    }

    const [order] = await db
      .select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
        status: purchaseOrders.status,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, purchaseOrderId))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }

    if (order.supplierId !== supplierId) {
      return NextResponse.json(
        { error: "Supplier does not match the selected purchase order" },
        { status: 400 }
      );
    }

    if (order.status !== "delivered" && order.status !== "closed") {
      return NextResponse.json(
        {
          error:
            "Quality tests can only be recorded for delivered or closed orders",
        },
        { status: 400 }
      );
    }

    const result: "pass" | "fail" =
      fc >= 65 && mc <= 12 && ac <= 8 ? "pass" : "fail";

    const [newTest] = await db
      .insert(qualityTests)
      .values({
        purchaseOrderId,
        supplierId,
        fixedCarbonPct: fc.toString(),
        moisturePct: mc.toString(),
        ashPct: ac.toString(),
        volatilePct: vc?.toString() ?? null,
        result,
        notes: notes || null,
        testedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newTest, { status: 201 });
  } catch (error) {
    console.error("Failed to create quality test:", error);
    return NextResponse.json(
      { error: "Failed to create quality test" },
      { status: 500 }
    );
  }
}
