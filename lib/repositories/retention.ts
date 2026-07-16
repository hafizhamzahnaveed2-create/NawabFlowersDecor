import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function subscribeNewsletter(email: string) {
  return prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { isActive: true, unsubscribedAt: null },
    create: { email },
  });
}

export async function syncAbandonedCart(
  email: string,
  cartSnapshot: { lines: unknown[]; subtotal: number },
  userId?: string | null,
) {
  if (!cartSnapshot.lines.length) {
    // Empty cart — mark recovered / clear pending.
    await prisma.abandonedCart.updateMany({
      where: { email, recoveredAt: null },
      data: { recoveredAt: new Date(), cartSnapshot: cartSnapshot as Prisma.InputJsonValue },
    });
    return null;
  }

  return prisma.abandonedCart.upsert({
    where: { email },
    update: {
      cartSnapshot: cartSnapshot as Prisma.InputJsonValue,
      lastActivityAt: new Date(),
      userId: userId ?? undefined,
      recoveredAt: null,
    },
    create: {
      email,
      userId: userId ?? null,
      cartSnapshot: cartSnapshot as Prisma.InputJsonValue,
    },
  });
}

export async function markCartRecovered(email: string) {
  await prisma.abandonedCart.updateMany({
    where: { email, recoveredAt: null },
    data: { recoveredAt: new Date() },
  });
}

/**
 * Finds carts idle for >= hours with no reminder yet. In Phase 5 we log the
 * intent; wire Resend/SendGrid in a later phase without changing this shape.
 */
export async function processAbandonedCartReminders(idleHours = 24) {
  const cutoff = new Date(Date.now() - idleHours * 60 * 60 * 1000);
  const carts = await prisma.abandonedCart.findMany({
    where: {
      recoveredAt: null,
      reminderSentAt: null,
      lastActivityAt: { lte: cutoff },
    },
    take: 50,
  });

  const results: { email: string; status: string }[] = [];
  for (const cart of carts) {
    // Stub: no email provider configured yet. Mark as sent so we don't
    // re-queue endlessly; replace this block with Resend when keys land.
    console.info(
      `[abandoned-cart] would email ${cart.email} (idle since ${cart.lastActivityAt.toISOString()})`,
    );
    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: { reminderSentAt: new Date() },
    });
    results.push({ email: cart.email, status: "queued_stub" });
  }
  return results;
}

export async function getLoyaltyPoints(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loyaltyPoints: true },
  });
  return user?.loyaltyPoints ?? 0;
}

/** 1 loyalty point per Rs 100 spent (floor). */
export function pointsForOrderTotal(total: number): number {
  return Math.floor(total / 100);
}

export async function awardLoyaltyPoints(userId: string, total: number) {
  const points = pointsForOrderTotal(total);
  if (points <= 0) return 0;
  await prisma.user.update({
    where: { id: userId },
    data: { loyaltyPoints: { increment: points } },
  });
  return points;
}
