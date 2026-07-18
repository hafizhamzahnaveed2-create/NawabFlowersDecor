import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { ChangePasswordInput, UpdateProfileInput } from "@/lib/validation/account";

export async function getAccountProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
    },
  });
}

export async function updateAccountProfile(
  userId: string,
  input: UpdateProfileInput,
) {
  const phone = input.phone?.trim() ? input.phone.trim() : null;
  const image =
    input.image === undefined
      ? undefined
      : input.image?.trim()
        ? input.image.trim()
        : null;

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name.trim(),
      phone,
      ...(image !== undefined ? { image } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
    },
  });
}

export async function changeAccountPassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    throw new Error("PASSWORD_NOT_SET");
  }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("CURRENT_PASSWORD_INVALID");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}
