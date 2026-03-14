import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, suppliers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser, isProcurementUser } from "@/lib/auth/session";
import {
  canTransitionOrderStatus,
  type OrderStatus,
  isOrderStatus,
} from "@/lib/orders/status";
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

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function normalizeOptionalDate(value: unknown): Date | null | "invalid" | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "invalid" : parsed;
}

function normalizeOptionalPositiveDecimal(
  value: unknown
): string | null | "invalid" | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "invalid";
  }

  return parsed.toString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const [order] = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        supplierId: purchaseOrders.supplierId,
        createdBy: purchaseOrders.createdBy,
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
        supplierEmail: suppliers.email,
        supplierState: suppliers.state,
        supplierDistrict: suppliers.district,
        supplierAddress: suppliers.address,
        supplierOwnerName: suppliers.ownerName,
      })
      .from(purchaseOrders)
      .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Failed to fetch order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
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

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isProcurementUser(sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const [existingOrder] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id))
      .limit(1);

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) {
      if (!isOrderStatus(body.status)) {
        return NextResponse.json(
          { error: "Invalid order status" },
          { status: 400 }
        );
      }

      const currentStatus = (existingOrder.status ?? "draft") as OrderStatus;
      if (!canTransitionOrderStatus(currentStatus, body.status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition from ${currentStatus} to ${body.status}`,
          },
          { status: 400 }
        );
      }

      updateData.status = body.status;
    }

    const transporterDetails = normalizeOptionalText(body.transporterDetails);
    if (transporterDetails !== undefined) {
      updateData.transporterDetails = transporterDetails;
    }

    const vehicleNumber = normalizeOptionalText(body.vehicleNumber);
    if (vehicleNumber !== undefined) {
      updateData.vehicleNumber = vehicleNumber;
    }

    const lrNumber = normalizeOptionalText(body.lrNumber);
    if (lrNumber !== undefined) {
      updateData.lrNumber = lrNumber;
    }

    const actualDeliveryDate = normalizeOptionalDate(body.actualDeliveryDate);
    if (actualDeliveryDate === "invalid") {
      return NextResponse.json(
        { error: "Actual delivery date is invalid" },
        { status: 400 }
      );
    }
    if (actualDeliveryDate !== undefined) {
      updateData.actualDeliveryDate = actualDeliveryDate;
    }

    const quantityReceived = normalizeOptionalPositiveDecimal(
      body.quantityReceived
    );
    if (quantityReceived === "invalid") {
      return NextResponse.json(
        { error: "Quantity received must be greater than zero" },
        { status: 400 }
      );
    }
    if (quantityReceived !== undefined) {
      updateData.quantityReceived = quantityReceived;
    }

    const expectedDeliveryDate = normalizeOptionalDate(body.expectedDeliveryDate);
    if (expectedDeliveryDate === "invalid") {
      return NextResponse.json(
        { error: "Expected delivery date is invalid" },
        { status: 400 }
      );
    }
    if (expectedDeliveryDate !== undefined) {
      updateData.expectedDeliveryDate = expectedDeliveryDate;
    }

    if (body.items !== undefined) {
      const normalizedItems = normalizeOrderItems(body.items);
      if (!normalizedItems) {
        return NextResponse.json(
          {
            error:
              "Items must include a charcoal type and positive quantity and price values",
          },
          { status: 400 }
        );
      }

      updateData.items = normalizedItems;
      const totalAmount = normalizedItems.reduce(
        (sum: number, item) => sum + item.quantityTons * item.pricePerTon,
        0
      );
      updateData.totalAmount = totalAmount.toFixed(2);
    }

    if (body.paymentTerms !== undefined) {
      updateData.paymentTerms = normalizeOptionalText(body.paymentTerms) ?? null;
    }

    const targetStatus = (body.status ??
      existingOrder.status ??
      "draft") as OrderStatus;
    const finalTransporterDetails =
      transporterDetails !== undefined
        ? transporterDetails
        : existingOrder.transporterDetails;
    const finalVehicleNumber =
      vehicleNumber !== undefined ? vehicleNumber : existingOrder.vehicleNumber;
    const finalLrNumber =
      lrNumber !== undefined ? lrNumber : existingOrder.lrNumber;
    const finalActualDeliveryDate =
      actualDeliveryDate !== undefined
        ? actualDeliveryDate
        : existingOrder.actualDeliveryDate;
    const finalQuantityReceived =
      quantityReceived !== undefined
        ? quantityReceived
        : existingOrder.quantityReceived;

    if (
      targetStatus === "in_transit" &&
      (!finalTransporterDetails || !finalVehicleNumber || !finalLrNumber)
    ) {
      return NextResponse.json(
        {
          error:
            "Transporter details, vehicle number, and LR number are required before marking an order in transit",
        },
        { status: 400 }
      );
    }

    if (
      (targetStatus === "delivered" || targetStatus === "closed") &&
      (!finalActualDeliveryDate || !finalQuantityReceived)
    ) {
      return NextResponse.json(
        {
          error:
            "Actual delivery date and quantity received are required before marking an order delivered or closed",
        },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set(updateData)
      .where(eq(purchaseOrders.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
