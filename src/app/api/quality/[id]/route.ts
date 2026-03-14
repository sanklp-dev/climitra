import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { qualityTests, purchaseOrders, suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const [test] = await db
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
      .where(eq(qualityTests.id, id));

    if (!test) {
      return NextResponse.json(
        { error: "Quality test not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error("Failed to fetch quality test:", error);
    return NextResponse.json(
      { error: "Failed to fetch quality test" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const [existing] = await db
      .select()
      .from(qualityTests)
      .where(eq(qualityTests.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Quality test not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    const fixedCarbonPct = parsePercentage(body.fixedCarbonPct);
    if (body.fixedCarbonPct !== undefined) {
      if (fixedCarbonPct === null) {
        return NextResponse.json(
          { error: "Fixed carbon percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
      updateData.fixedCarbonPct = fixedCarbonPct.toString();
    }

    const moisturePct = parsePercentage(body.moisturePct);
    if (body.moisturePct !== undefined) {
      if (moisturePct === null) {
        return NextResponse.json(
          { error: "Moisture percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
      updateData.moisturePct = moisturePct.toString();
    }

    const ashPct = parsePercentage(body.ashPct);
    if (body.ashPct !== undefined) {
      if (ashPct === null) {
        return NextResponse.json(
          { error: "Ash percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
      updateData.ashPct = ashPct.toString();
    }

    const volatilePct = parsePercentage(body.volatilePct);
    if (body.volatilePct !== undefined) {
      if (volatilePct === null) {
        return NextResponse.json(
          { error: "Volatile matter percentage must be between 0 and 100" },
          { status: 400 }
        );
      }
      updateData.volatilePct = volatilePct.toString();
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    if (
      body.fixedCarbonPct !== undefined ||
      body.moisturePct !== undefined ||
      body.ashPct !== undefined
    ) {
      const fc = fixedCarbonPct ?? parseFloat(existing.fixedCarbonPct ?? "0");
      const mc = moisturePct ?? parseFloat(existing.moisturePct ?? "100");
      const ac = ashPct ?? parseFloat(existing.ashPct ?? "100");

      updateData.result = fc >= 65 && mc <= 12 && ac <= 8 ? "pass" : "fail";
    }

    if (body.result !== undefined && !updateData.result) {
      if (body.result !== "pass" && body.result !== "fail") {
        return NextResponse.json(
          { error: "Result must be either 'pass' or 'fail'" },
          { status: 400 }
        );
      }
      updateData.result = body.result;
    }

    const [updated] = await db
      .update(qualityTests)
      .set(updateData)
      .where(eq(qualityTests.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Quality test not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update quality test:", error);
    return NextResponse.json(
      { error: "Failed to update quality test" },
      { status: 500 }
    );
  }
}
