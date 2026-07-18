/** Permission keys used for admin RBAC. Keep in sync with prisma seed. */
export const PERMISSIONS = [
  "catalog.read",
  "catalog.write",
  "orders.read",
  "orders.fulfill",
  "content.write",
  "staff.manage",
  "analytics.read",
  "settings.write",
  "coupons.write",
  "reviews.moderate",
  "payments.write",
  "activity.read",
  "builder.write",
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number];

export function isPermissionKey(value: string): value is PermissionKey {
  return (PERMISSIONS as readonly string[]).includes(value);
}
