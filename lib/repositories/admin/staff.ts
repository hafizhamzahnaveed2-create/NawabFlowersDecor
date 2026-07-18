import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/repositories/admin/activity";
import type { CreateStaffUserInput } from "@/lib/validation/staff";

export async function listStaffUsers() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "ADMIN"] } },
    orderBy: [{ role: "asc" }, { email: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      staffProfile: {
        select: {
          id: true,
          isActive: true,
          staffRoleId: true,
          staffRole: { select: { id: true, name: true } },
        },
      },
    },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    profile: u.staffProfile
      ? {
          id: u.staffProfile.id,
          isActive: u.staffProfile.isActive,
          staffRoleId: u.staffProfile.staffRoleId,
          staffRoleName: u.staffProfile.staffRole?.name ?? null,
        }
      : null,
  }));
}

export async function listStaffRoles() {
  return prisma.staffRole.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true },
  });
}

async function countActiveAdmins() {
  return prisma.user.count({
    where: {
      role: "ADMIN",
      OR: [
        { staffProfile: null },
        { staffProfile: { isActive: true } },
      ],
    },
  });
}

export async function createStaffUser(
  input: CreateStaffUserInput,
  actorId: string,
) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw new Error("EMAIL_TAKEN");

  if (input.staffRoleId) {
    const role = await prisma.staffRole.findUnique({
      where: { id: input.staffRoleId },
    });
    if (!role) throw new Error("INVALID_ROLE");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      staffProfile: {
        create: {
          staffRoleId: input.staffRoleId ?? null,
          isActive: input.isActive ?? true,
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      staffProfile: {
        select: {
          id: true,
          isActive: true,
          staffRoleId: true,
          staffRole: { select: { name: true } },
        },
      },
    },
  });

  await logActivity(actorId, "staff.create", "User", user.id, {
    email: user.email,
    role: user.role,
    staffRoleId: user.staffProfile?.staffRoleId ?? null,
  });

  return user;
}

export async function updateStaffProfile(
  userId: string,
  input: {
    staffRoleId?: string | null;
    isActive?: boolean;
    role?: "STAFF" | "ADMIN";
  },
  actorId: string,
) {
  if (userId === actorId && input.isActive === false) {
    throw new Error("CANNOT_BLOCK_SELF");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      staffProfile: { select: { isActive: true } },
    },
  });
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    throw new Error("NOT_STAFF");
  }

  if (input.staffRoleId) {
    const role = await prisma.staffRole.findUnique({
      where: { id: input.staffRoleId },
    });
    if (!role) throw new Error("INVALID_ROLE");
  }

  const currentlyActive =
    user.staffProfile == null ? true : user.staffProfile.isActive;
  const willBeActive =
    input.isActive !== undefined ? input.isActive : currentlyActive;
  const willBeAdmin = input.role ? input.role === "ADMIN" : user.role === "ADMIN";

  // Don't leave the shop with zero active admins.
  if (user.role === "ADMIN" && currentlyActive && (!willBeActive || !willBeAdmin)) {
    const admins = await countActiveAdmins();
    if (admins <= 1) throw new Error("LAST_ADMIN");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.role) {
      await tx.user.update({
        where: { id: userId },
        data: { role: input.role },
      });
    }

    return tx.staffProfile.upsert({
      where: { userId },
      update: {
        ...(input.staffRoleId !== undefined && {
          staffRoleId: input.staffRoleId,
        }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      create: {
        userId,
        staffRoleId: input.staffRoleId ?? null,
        isActive: input.isActive ?? true,
      },
      include: {
        staffRole: { select: { id: true, name: true } },
      },
    });
  });

  await logActivity(actorId, "staff.update", "StaffProfile", updated.id, {
    userId,
    staffRoleId: updated.staffRoleId,
    isActive: updated.isActive,
    role: input.role,
  });

  return updated;
}

export async function deleteStaffUser(userId: string, actorId: string) {
  if (userId === actorId) throw new Error("CANNOT_DELETE_SELF");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      staffProfile: { select: { isActive: true } },
    },
  });
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) {
    throw new Error("NOT_STAFF");
  }

  const isActiveAdmin =
    user.role === "ADMIN" &&
    (user.staffProfile == null || user.staffProfile.isActive);
  if (isActiveAdmin) {
    const admins = await countActiveAdmins();
    if (admins <= 1) throw new Error("LAST_ADMIN");
  }

  await prisma.user.delete({ where: { id: userId } });
  await logActivity(actorId, "staff.delete", "User", userId, {
    email: user.email,
    role: user.role,
  });
}
