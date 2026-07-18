import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export async function logActivity(
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  detail?: Record<string, unknown>,
  tx?: Tx,
) {
  await (tx ?? prisma).activityLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      detail: detail as Prisma.InputJsonValue | undefined,
    },
  });
}

/** Paginated activity feed for the admin audit log. */
export async function listActivity(limit = 50) {
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
    actorEmail: row.user?.email ?? null,
    actorName: row.user?.name ?? null,
  }));
}

/** Recent status changes for an order (for the admin order screen). */
export async function getOrderStatusHistory(orderId: string, limit = 12) {
  const rows = await prisma.activityLog.findMany({
    where: {
      entityType: "Order",
      entityId: orderId,
      action: "order.status_change",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { email: true } } },
  });

  return rows.map((row) => {
    const detail = row.detail as { status?: string } | null;
    return {
      id: row.id,
      status: detail?.status ?? "UNKNOWN",
      createdAt: row.createdAt.toISOString(),
      actorEmail: row.user?.email ?? null,
    };
  });
}
