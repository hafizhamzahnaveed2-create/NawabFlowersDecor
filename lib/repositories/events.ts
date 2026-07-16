import { prisma } from "@/lib/db";
import type { StoreEventInput } from "@/lib/validation/analytics";
import type { Prisma } from "@/lib/generated/prisma/client";

export async function recordStoreEvent(
  input: StoreEventInput,
  userId?: string | null,
) {
  return prisma.storeEvent.create({
    data: {
      kind: input.kind,
      path: input.path ?? null,
      productId: input.productId ?? null,
      sessionId: input.sessionId ?? null,
      userId: userId ?? null,
      meta: (input.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
