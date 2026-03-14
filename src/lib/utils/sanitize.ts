/**
 * Sanitize string input by stripping HTML tags to prevent XSS
 */
export function sanitize(input: string | null | undefined): string | null {
  if (!input) return null;
  return input.replace(/<[^>]*>/g, "").trim() || null;
}

/**
 * Validate UUID v4 format
 */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

/**
 * Valid PO status transitions
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["acknowledged"],
  acknowledged: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["closed"],
  closed: [],
};

export function isValidStatusTransition(current: string, next: string): boolean {
  return VALID_TRANSITIONS[current]?.includes(next) ?? false;
}
