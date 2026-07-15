import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export async function logActivity(
  userId: string,
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
