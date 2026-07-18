// Delivery scheduling rules. Flowers are perishable and time-sensitive:
// orders are delivered from the earliest allowed day up to N days out, in fixed slots.
// Keep this module free of Prisma — it is imported by client components.

export const DELIVERY_TIME_SLOTS = [
  "09:00 – 12:00",
  "12:00 – 15:00",
  "15:00 – 18:00",
  "18:00 – 21:00",
] as const;

/** Fallback when no delivery zone matches (overridable via SiteSetting). */
export const DEFAULT_DELIVERY_FEE = 250;

/** 0 = same-day delivery allowed (default). Overridable via SiteSetting. */
export const DEFAULT_MIN_LEAD_DAYS = 0;
export const DEFAULT_MAX_LEAD_DAYS = 30;

/** @deprecated Prefer DEFAULT_MIN_LEAD_DAYS */
export const MIN_LEAD_DAYS = DEFAULT_MIN_LEAD_DAYS;
/** @deprecated Prefer DEFAULT_MAX_LEAD_DAYS */
export const MAX_LEAD_DAYS = DEFAULT_MAX_LEAD_DAYS;

/** @deprecated Prefer DEFAULT_DELIVERY_FEE / server quote — cart estimate only. */
export const DELIVERY_FEE = DEFAULT_DELIVERY_FEE;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function earliestDeliveryDate(
  now = new Date(),
  minLeadDays = DEFAULT_MIN_LEAD_DAYS,
): Date {
  const d = startOfDay(now);
  d.setDate(d.getDate() + Math.max(0, minLeadDays));
  return d;
}

export function latestDeliveryDate(
  now = new Date(),
  maxLeadDays = DEFAULT_MAX_LEAD_DAYS,
): Date {
  const d = startOfDay(now);
  d.setDate(d.getDate() + Math.max(1, maxLeadDays));
  return d;
}

/** yyyy-mm-dd for <input type="date"> attributes. */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
