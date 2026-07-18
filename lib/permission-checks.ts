import type { PermissionKey } from "@/lib/permissions";

export function hasAllPermissions(
  held: string[] | undefined,
  required: PermissionKey[],
): boolean {
  if (!held?.length) return false;
  const set = new Set(held);
  return required.every((k) => set.has(k));
}

export function hasAnyPermission(
  held: string[] | undefined,
  required: PermissionKey[],
): boolean {
  if (!held?.length) return false;
  const set = new Set(held);
  return required.some((k) => set.has(k));
}
