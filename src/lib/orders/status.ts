export const ORDER_STATUSES = [
  "draft",
  "sent",
  "acknowledged",
  "in_transit",
  "delivered",
  "closed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  draft: ["sent"],
  sent: ["acknowledged"],
  acknowledged: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["closed"],
  closed: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return (
    typeof value === "string" &&
    ORDER_STATUSES.includes(value as OrderStatus)
  );
}

export function canTransitionOrderStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
): boolean {
  return (
    currentStatus === nextStatus ||
    ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)
  );
}
