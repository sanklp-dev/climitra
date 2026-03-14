import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { isValidUUID } from "@/lib/utils/sanitize";
import { requireAuth } from "@/lib/auth/api-guard";
import { getSessionUser, isProcurementUser } from "@/lib/auth/session";

const EDITABLE_SUPPLIER_FIELDS = [
  "businessName",
  "ownerName",
  "phone",
  "email",
  "address",
  "state",
  "district",
  "pinCode",
  "lat",
  "lng",
  "leadCategories",
  "charcoalType",
  "species",
  "form",
  "capacityTonsPerMonth",
  "currentAvailability",
  "pricePerTon",
  "pricingBasis",
  "fixedCarbonPct",
  "moisturePct",
  "ashPct",
  "volatilePct",
  "tier",
  "status",
  "internalRating",
  "certifications",
  "photoUrls",
] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid supplier ID format" }, { status: 400 });
    }
    const result = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier: result[0] });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
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

    const sessionUser = await getSessionUser();
    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid supplier ID format" }, { status: 400 });
    }
    const body = await request.json();

    const existing = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const field of EDITABLE_SUPPLIER_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json(
        { error: "No editable supplier fields were provided" },
        { status: 400 }
      );
    }

    const updated = await db
      .update(suppliers)
      .set(updateData)
      .where(eq(suppliers.id, id))
      .returning();

    return NextResponse.json({ supplier: updated[0] });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const sessionUser = await getSessionUser();
    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    if (!isValidUUID(id)) {
      return NextResponse.json({ error: "Invalid supplier ID format" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Soft delete - set status to inactive
    const updated = await db
      .update(suppliers)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, id))
      .returning();

    return NextResponse.json({ supplier: updated[0] });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
