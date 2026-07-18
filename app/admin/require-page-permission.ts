import { redirect } from "next/navigation";
import {
  requireAnyPermission,
  requirePermission,
} from "@/lib/auth-helpers";
import type { PermissionKey } from "@/lib/permissions";

export async function requirePagePermission(...keys: PermissionKey[]) {
  const session = await requirePermission(...keys);
  if (!session) redirect("/admin?denied=1");
  return session;
}

export async function requireAnyPagePermission(...keys: PermissionKey[]) {
  const session = await requireAnyPermission(...keys);
  if (!session) redirect("/admin?denied=1");
  return session;
}
