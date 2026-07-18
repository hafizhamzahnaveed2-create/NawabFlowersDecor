import type { UserRole } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { PERMISSIONS, type PermissionKey } from "@/lib/permissions";

export {
  hasAllPermissions,
  hasAnyPermission,
} from "@/lib/permission-checks";

export async function loadStaffPermissions(
  userId: string,
  role: UserRole,
): Promise<PermissionKey[]> {
  if (role !== "ADMIN" && role !== "STAFF") return [];

  const profile = await prisma.staffProfile.findUnique({
    where: { userId },
    include: {
      staffRole: {
        include: {
          permissions: { include: { permission: { select: { key: true } } } },
        },
      },
    },
  });

  if (profile && !profile.isActive) return [];

  if (role === "ADMIN" && !profile?.staffRole) {
    return [...PERMISSIONS];
  }

  const keys =
    profile?.staffRole?.permissions.map((p) => p.permission.key) ?? [];
  return keys.filter((k): k is PermissionKey =>
    (PERMISSIONS as readonly string[]).includes(k),
  );
}
