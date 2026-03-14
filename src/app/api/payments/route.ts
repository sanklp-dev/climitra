import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { payments, purchaseOrders, suppliers } from "@/lib/db/schema";
import { eq, desc, and, sql, SQL } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/api-guard";
import { getSessionUser, isProcurementUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");

    const conditions: SQL[] = [];

    if (status && (status === "pending" || status === "partial" || status === "paid")) {
      conditions.push(eq(payments.status, status));
    }

    if (supplierId) {
      conditions.push(eq(payments.supplierId, supplierId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const paymentList = await db
      .select({
        id: payments.id,
        purchaseOrderId: payments.purchaseOrderId,
        supplierId: payments.supplierId,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        paymentMode: payments.paymentMode,
        invoiceUrl: payments.invoiceUrl,
        status: payments.status,
        notes: payments.notes,
        createdAt: payments.createdAt,
        poNumber: purchaseOrders.poNumber,
        poTotalAmount: purchaseOrders.totalAmount,
        supplierName: suppliers.businessName,
      })
      .from(payments)
      .leftJoin(purchaseOrders, eq(payments.purchaseOrderId, purchaseOrders.id))
      .leftJoin(suppliers, eq(payments.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(desc(payments.createdAt));

    // Get summary stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [summaryResult] = await db
      .select({
        totalOutstanding: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} != 'paid' THEN ${payments.amount} ELSE 0 END), 0)`,
        totalPaidThisMonth: sql<string>`COALESCE(SUM(CASE WHEN ${payments.status} = 'paid' AND ${payments.paymentDate} >= ${startOfMonth.toISOString()} THEN ${payments.amount} ELSE 0 END), 0)`,
        pendingCount: sql<number>`COUNT(CASE WHEN ${payments.status} = 'pending' THEN 1 END)::int`,
      })
      .from(payments);

    return NextResponse.json({
      payments: paymentList,
      summary: {
        totalOutstanding: summaryResult?.totalOutstanding ?? "0",
        totalPaidThisMonth: summaryResult?.totalPaidThisMonth ?? "0",
        pendingCount: summaryResult?.pendingCount ?? 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const sessionUser = await getSessionUser();
    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      purchaseOrderId,
      supplierId,
      amount,
      paymentDate,
      paymentMode,
      invoiceUrl,
      status,
      notes,
    } = body;

    if (!purchaseOrderId || !supplierId || !amount) {
      return NextResponse.json(
        { error: "Purchase order, supplier, and amount are required" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be a positive number" },
        { status: 400 }
      );
    }

    const [order] = await db
      .select({
        id: purchaseOrders.id,
        supplierId: purchaseOrders.supplierId,
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

    const [newPayment] = await db
      .insert(payments)
      .values({
        purchaseOrderId,
        supplierId,
        amount: parsedAmount.toString(),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMode: paymentMode || null,
        invoiceUrl: invoiceUrl || null,
        status: status || "pending",
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(newPayment, { status: 201 });
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
