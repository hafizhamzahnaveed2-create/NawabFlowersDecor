import { prisma } from "@/lib/db";
import type { ComponentKind } from "@/lib/generated/prisma/client";
import type { BouquetComponentInput } from "@/lib/validation/builder";
import { logActivity } from "@/lib/repositories/admin/activity";

export type BuilderComponent = {
  id: string;
  kind: ComponentKind;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  stock: number;
  minQty: number;
  maxQty: number;
  sortOrder: number;
  isActive: boolean;
  productId: string | null;
  productName: string | null;
};

function toDto(row: {
  id: string;
  kind: ComponentKind;
  name: string;
  imageUrl: string | null;
  unitPrice: { toString(): string } | number;
  stock: number;
  minQty: number;
  maxQty: number;
  sortOrder: number;
  isActive: boolean;
  productId: string | null;
  product?: { name: string } | null;
}): BuilderComponent {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    imageUrl: row.imageUrl,
    unitPrice: Number(row.unitPrice),
    stock: row.stock,
    minQty: row.minQty,
    maxQty: row.maxQty,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    productId: row.productId,
    productName: row.product?.name ?? null,
  };
}

/** Active components for the customer-facing builder, grouped by kind. */
export async function listActiveBuilderComponents() {
  const rows = await prisma.bouquetComponent.findMany({
    where: { isActive: true, stock: { gt: 0 } },
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { product: { select: { name: true } } },
  });
  return rows.map(toDto);
}

export async function listAdminBuilderComponents() {
  const rows = await prisma.bouquetComponent.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: { product: { select: { name: true } } },
  });
  return rows.map(toDto);
}

export async function getBuilderComponent(id: string) {
  const row = await prisma.bouquetComponent.findUnique({
    where: { id },
    include: { product: { select: { name: true } } },
  });
  return row ? toDto(row) : null;
}

export async function createBuilderComponent(
  input: BouquetComponentInput,
  userId: string | null,
) {
  const row = await prisma.bouquetComponent.create({
    data: {
      kind: input.kind,
      name: input.name,
      imageUrl: input.imageUrl,
      unitPrice: input.unitPrice,
      stock: input.stock,
      minQty: input.minQty,
      maxQty: input.maxQty,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      productId: input.productId || null,
    },
    include: { product: { select: { name: true } } },
  });
  await logActivity(userId, "builder_component.create", "BouquetComponent", row.id, {
    name: row.name,
    kind: row.kind,
  });
  return toDto(row);
}

export async function updateBuilderComponent(
  id: string,
  input: BouquetComponentInput,
  userId: string | null,
) {
  const row = await prisma.bouquetComponent.update({
    where: { id },
    data: {
      kind: input.kind,
      name: input.name,
      imageUrl: input.imageUrl,
      unitPrice: input.unitPrice,
      stock: input.stock,
      minQty: input.minQty,
      maxQty: input.maxQty,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      productId: input.productId || null,
    },
    include: { product: { select: { name: true } } },
  });
  await logActivity(userId, "builder_component.update", "BouquetComponent", row.id, {
    name: row.name,
  });
  return toDto(row);
}

export async function deleteBuilderComponent(
  id: string,
  userId: string | null,
) {
  await prisma.bouquetComponent.delete({ where: { id } });
  await logActivity(userId, "builder_component.delete", "BouquetComponent", id);
}

/** Raw materials that can be linked into the builder (not already linked). */
export async function listLinkableRawMaterials(excludeComponentId?: string) {
  const linked = await prisma.bouquetComponent.findMany({
    where: {
      productId: { not: null },
      ...(excludeComponentId ? { id: { not: excludeComponentId } } : {}),
    },
    select: { productId: true },
  });
  const linkedIds = linked
    .map((c) => c.productId)
    .filter((id): id is string => !!id);

  return prisma.product.findMany({
    where: {
      type: "RAW_MATERIAL",
      isActive: true,
      id: { notIn: linkedIds },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
    },
  });
}
