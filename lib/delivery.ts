// Delivery scheduling rules. Flowers are perishable and time-sensitive:
// orders are delivered from the next day up to 30 days out, in fixed slots.

export const DELIVERY_TIME_SLOTS = [
  "09:00 – 12:00",
  "12:00 – 15:00",
  "15:00 – 18:00",
  "18:00 – 21:00",
] as const;

export const DELIVERY_FEE = 250; // flat PKR fee for MVP; zone-based later
export const MIN_LEAD_DAYS = 1;
export const MAX_LEAD_DAYS = 30;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function earliestDeliveryDate(now = new Date()): Date {
  const d = startOfDay(now);
  d.setDate(d.getDate() + MIN_LEAD_DAYS);
  return d;
}

export function latestDeliveryDate(now = new Date()): Date {
  const d = startOfDay(now);
  d.setDate(d.getDate() + MAX_LEAD_DAYS);
  return d;
}

/** yyyy-mm-dd for <input type="date"> attributes. */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
