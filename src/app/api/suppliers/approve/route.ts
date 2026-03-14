import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/api-guard";
import { getSessionUser, isProcurementUser } from "@/lib/auth/session";

export async function PATCH(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const sessionUser = await getSessionUser();
    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    if (!body.action || !["approve", "reject"].includes(body.action)) {
      return NextResponse.json(
        { error: "Action must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const newStatus = body.action === "approve" ? "active" : "inactive";

    const updated = await db
      .update(suppliers)
      .set({
        status: newStatus as "active" | "inactive",
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, body.id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Supplier ${body.action === "approve" ? "approved" : "rejected"} successfully`,
      supplier: updated[0],
    });
  } catch (error) {
    console.error("Error updating supplier status:", error);
    return NextResponse.json(
      { error: "Failed to update supplier status" },
      { status: 500 }
    );
  }
}
