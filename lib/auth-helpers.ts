import { auth } from "@/lib/auth";
import type { PermissionKey } from "@/lib/permissions";
import {
  hasAllPermissions,
  hasAnyPermission,
} from "@/lib/permission-checks";

/**
 * Session guard for admin API routes. Middleware already protects /admin
 * pages; API routes verify independently so they can't be called directly.
 */
export async function requireStaff() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "STAFF")) {
    return null;
  }
  // Inactive staff profiles land with empty permissions — treat as denied.
  if (!session.user.permissions?.length) {
    return null;
  }
  return session;
}

/** Require staff session that holds every listed permission. */
export async function requirePermission(...keys: PermissionKey[]) {
  const session = await requireStaff();
  if (!session) return null;
  if (!hasAllPermissions(session.user.permissions, keys)) return null;
  return session;
}

/** Require staff session that holds at least one listed permission. */
export async function requireAnyPermission(...keys: PermissionKey[]) {
  const session = await requireStaff();
  if (!session) return null;
  if (!hasAnyPermission(session.user.permissions, keys)) return null;
  return session;
}

export function sessionHasPermission(
  session: { user?: { permissions?: string[] } } | null,
  key: PermissionKey,
): boolean {
  return !!session?.user?.permissions?.includes(key);
}
