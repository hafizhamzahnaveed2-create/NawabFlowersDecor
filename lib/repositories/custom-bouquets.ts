import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import type { CreateCustomBouquetInput } from "@/lib/validation/builder";

export class BuilderError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export type CustomBouquetSummary = {
  id: string;
  name: string | null;
  totalPrice: number;
  shareToken: string;
  previewImageUrl: string | null;
  items: {
    componentId: string | null;
    componentKind: string;
    componentName: string;
    unitPrice: number;
    quantity: number;
    imageUrl: string | null;
  }[];
};

/**
 * Persists a customer design with price/name snapshots. Later component
 * price changes never mutate this row — checkout uses the snapshot total.
 */
export async function createCustomBouquet(
  input: CreateCustomBouquetInput,
  userId: string | null,
): Promise<CustomBouquetSummary> {
  const ids = [...new Set(input.items.map((i) => i.componentId))];
  const components = await prisma.bouquetComponent.findMany({
    where: { id: { in: ids }, isActive: true },
  });
  const byId = new Map(components.map((c) => [c.id, c]));

  // Must include at least one stem.
  let hasStem = false;
  const resolved = input.items.map((item) => {
    const component = byId.get(item.componentId);
    if (!component) {
      throw new BuilderError("A selected item is no longer available");
    }
    if (item.quantity < component.minQty) {
      throw new BuilderError(
        `“${component.name}” requires at least ${component.minQty}`,
      );
    }
    if (item.quantity > component.maxQty) {
      throw new BuilderError(
        `“${component.name}” allows at most ${component.maxQty}`,
      );
    }
    if (component.stock < item.quantity) {
      throw new BuilderError(
        `Only ${component.stock} of “${component.name}” left`,
      );
    }
    if (component.kind === "STEM") hasStem = true;
    return {
      componentId: component.id,
      componentKind: component.kind,
      componentName: component.name,
      unitPrice: Number(component.unitPrice),
      quantity: item.quantity,
      imageUrl: component.imageUrl,
    };
  });

  if (!hasStem) {
    throw new BuilderError("Add at least one flower stem to your bouquet");
  }

  // Single-select kinds may only appear once.
  for (const kind of ["WRAP", "RIBBON", "VASE", "CARD"] as const) {
    const count = resolved.filter((r) => r.componentKind === kind).length;
    if (count > 1) {
      throw new BuilderError(`Choose only one ${kind.toLowerCase()}`);
    }
  }

  const totalPrice = resolved.reduce(
    (sum, r) => sum + r.unitPrice * r.quantity,
    0,
  );
  const shareToken = randomBytes(16).toString("hex");
  // Prefer a stem image for cart thumbnails.
  const previewImageUrl =
    resolved.find((r) => r.componentKind === "STEM" && r.imageUrl)?.imageUrl ??
    resolved.find((r) => r.imageUrl)?.imageUrl ??
    null;

  const name =
    input.name?.trim() ||
    (input.cardMessage?.trim()
      ? input.cardMessage.trim().slice(0, 40)
      : null);

  const bouquet = await prisma.customBouquet.create({
    data: {
      userId,
      name,
      totalPrice,
      previewImageUrl,
      shareToken,
      items: {
        create: resolved.map((r) => ({
          componentId: r.componentId,
          componentKind: r.componentKind,
          componentName: r.componentName,
          unitPrice: r.unitPrice,
          quantity: r.quantity,
        })),
      },
    },
    include: { items: true },
  });

  return {
    id: bouquet.id,
    name: bouquet.name,
    totalPrice: Number(bouquet.totalPrice),
    shareToken: bouquet.shareToken!,
    previewImageUrl: bouquet.previewImageUrl,
    items: resolved,
  };
}

export async function getCustomBouquetById(
  id: string,
): Promise<CustomBouquetSummary | null> {
  const bouquet = await prisma.customBouquet.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          component: { select: { imageUrl: true } },
        },
      },
    },
  });
  if (!bouquet) return null;
  return {
    id: bouquet.id,
    name: bouquet.name,
    totalPrice: Number(bouquet.totalPrice),
    shareToken: bouquet.shareToken ?? "",
    previewImageUrl: bouquet.previewImageUrl,
    items: bouquet.items.map((i) => ({
      componentId: i.componentId,
      componentKind: i.componentKind,
      componentName: i.componentName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      imageUrl: i.component?.imageUrl ?? null,
    })),
  };
}

export async function getCustomBouquetByShareToken(
  shareToken: string,
): Promise<CustomBouquetSummary | null> {
  const bouquet = await prisma.customBouquet.findUnique({
    where: { shareToken },
    include: {
      items: {
        include: { component: { select: { imageUrl: true } } },
      },
    },
  });
  if (!bouquet) return null;
  return {
    id: bouquet.id,
    name: bouquet.name,
    totalPrice: Number(bouquet.totalPrice),
    shareToken: bouquet.shareToken!,
    previewImageUrl: bouquet.previewImageUrl,
    items: bouquet.items.map((i) => ({
      componentId: i.componentId,
      componentKind: i.componentKind,
      componentName: i.componentName,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      imageUrl: i.component?.imageUrl ?? null,
    })),
  };
}
