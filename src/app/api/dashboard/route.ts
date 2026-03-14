import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suppliers, purchaseOrders, payments } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth/api-guard";

export async function GET() {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    // Get supplier count (active only)
    const [supplierCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(eq(suppliers.status, "active"));

    const supplierCount = supplierCountResult?.count ?? 0;

    // Get active orders (not closed/delivered)
    const [activeOrdersResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(purchaseOrders)
      .where(
        sql`${purchaseOrders.status} NOT IN ('closed', 'delivered')`
      );

    const activeOrders = activeOrdersResult?.count ?? 0;

    // Get pending deliveries (in_transit)
    const [pendingDeliveriesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.status, "in_transit"));

    const pendingDeliveries = pendingDeliveriesResult?.count ?? 0;

    // Get pending approvals (suppliers pending_approval)
    const [pendingApprovalsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(suppliers)
      .where(eq(suppliers.status, "pending_approval"));

    const pendingApprovals = pendingApprovalsResult?.count ?? 0;

    // Get recent orders with supplier name
    const recentOrders = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        totalAmount: purchaseOrders.totalAmount,
        status: purchaseOrders.status,
        createdAt: purchaseOrders.createdAt,
        supplierName: suppliers.businessName,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(5);

    // Get suppliers by state
    const suppliersByState = await db
      .select({
        state: suppliers.state,
        count: sql<number>`count(*)::int`,
      })
      .from(suppliers)
      .where(eq(suppliers.status, "active"))
      .groupBy(suppliers.state)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // Get orders by status
    const ordersByStatus = await db
      .select({
        status: purchaseOrders.status,
        count: sql<number>`count(*)::int`,
      })
      .from(purchaseOrders)
      .groupBy(purchaseOrders.status);

    // Top 5 suppliers by rating
    const topSuppliers = await db
      .select({
        id: suppliers.id,
        businessName: suppliers.businessName,
        state: suppliers.state,
        internalRating: suppliers.internalRating,
        capacityTonsPerMonth: suppliers.capacityTonsPerMonth,
      })
      .from(suppliers)
      .where(eq(suppliers.status, "active"))
      .orderBy(desc(suppliers.internalRating))
      .limit(5);

    return NextResponse.json({
      supplierCount,
      activeOrders,
      pendingDeliveries,
      pendingApprovals,
      recentOrders,
      suppliersByState,
      ordersByStatus,
      topSuppliers,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
