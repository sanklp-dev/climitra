import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, suppliers } from "@/lib/db/schema";
import { eq, desc, and, ilike, sql } from "drizzle-orm";
import { getSessionUser, isProcurementUser } from "@/lib/auth/session";
import { requireAuth } from "@/lib/auth/api-guard";

interface OrderItemInput {
  charcoalType: string;
  quantityTons: number;
  pricePerTon: number;
}

function normalizeOrderItems(value: unknown): OrderItemInput[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const normalized = value.map((item) => {
    const record =
      typeof item === "object" && item !== null
        ? (item as Record<string, unknown>)
        : null;

    const charcoalType =
      typeof record?.charcoalType === "string"
        ? record.charcoalType.trim()
        : "";
    const quantityTons = Number(record?.quantityTons);
    const pricePerTon = Number(record?.pricePerTon);

    return {
      charcoalType,
      quantityTons,
      pricePerTon,
    };
  });

  const hasInvalidItem = normalized.some(
    (item) =>
      !item.charcoalType ||
      !Number.isFinite(item.quantityTons) ||
      item.quantityTons <= 0 ||
      !Number.isFinite(item.pricePerTon) ||
      item.pricePerTon <= 0
  );

  return hasInvalidItem ? null : normalized;
}

function parseOptionalDate(value: unknown): Date | null | "invalid" {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
}

export async function GET(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    const conditions = [];

    if (status && status !== "all") {
      conditions.push(
        eq(
          purchaseOrders.status,
          status as
            | "draft"
            | "sent"
            | "acknowledged"
            | "in_transit"
            | "delivered"
            | "closed"
        )
      );
    }

    if (supplierId) {
      conditions.push(eq(purchaseOrders.supplierId, supplierId));
    }

    if (search) {
      conditions.push(ilike(purchaseOrders.poNumber, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orders = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        items: purchaseOrders.items,
        totalAmount: purchaseOrders.totalAmount,
        paymentTerms: purchaseOrders.paymentTerms,
        status: purchaseOrders.status,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        actualDeliveryDate: purchaseOrders.actualDeliveryDate,
        transporterDetails: purchaseOrders.transporterDetails,
        vehicleNumber: purchaseOrders.vehicleNumber,
        lrNumber: purchaseOrders.lrNumber,
        quantityReceived: purchaseOrders.quantityReceived,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
        supplierName: suppliers.businessName,
        supplierPhone: suppliers.phone,
        supplierState: suppliers.state,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(whereClause)
      .orderBy(desc(purchaseOrders.createdAt));

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const sessionUser = await getSessionUser();

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { supplierId, items, paymentTerms, expectedDeliveryDate } = body;
    const normalizedItems = normalizeOrderItems(items);

    if (!supplierId || !normalizedItems) {
      return NextResponse.json(
        {
          error:
            "Supplier and at least one valid item are required. Quantity and price must be greater than zero.",
        },
        { status: 400 }
      );
    }

    const [supplier] = await db
      .select({ id: suppliers.id, status: suppliers.status })
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    if (!supplier || supplier.status !== "active") {
      return NextResponse.json(
        { error: "Orders can only be created for active suppliers" },
        { status: 400 }
      );
    }

    const parsedExpectedDeliveryDate = parseOptionalDate(expectedDeliveryDate);

    if (parsedExpectedDeliveryDate === "invalid") {
      return NextResponse.json(
        { error: "Expected delivery date is invalid" },
        { status: 400 }
      );
    }

    const totalAmount = normalizedItems.reduce(
      (sum: number, item) => sum + item.quantityTons * item.pricePerTon,
      0
    );

    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    const newOrder = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${year})`);

      const lastOrder = await tx
        .select({ poNumber: purchaseOrders.poNumber })
        .from(purchaseOrders)
        .where(ilike(purchaseOrders.poNumber, `${prefix}%`))
        .orderBy(desc(purchaseOrders.poNumber))
        .limit(1);

      const lastSeq =
        lastOrder.length > 0
          ? parseInt(lastOrder[0].poNumber.split("-")[2] ?? "0", 10)
          : 0;
      const poNumber = `${prefix}${String(lastSeq + 1).padStart(3, "0")}`;

      const [insertedOrder] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber,
          supplierId,
          createdBy: sessionUser.id,
          items: normalizedItems,
          totalAmount: totalAmount.toFixed(2),
          paymentTerms:
            typeof paymentTerms === "string" && paymentTerms.trim()
              ? paymentTerms.trim()
              : null,
          expectedDeliveryDate: parsedExpectedDeliveryDate,
          status: "draft",
        })
        .returning();

      return insertedOrder;
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
