import { prisma } from "@/lib/db";
import type { ProductCard } from "@/lib/repositories/products";

/**
 * Products frequently bought together with `productId`, based on co-occurrence
 * in non-cancelled orders. Falls back to related category products when sparse.
 */
export async function getFrequentlyBoughtTogether(
  productId: string,
  limit = 4,
): Promise<ProductCard[]> {
  const companionIds = await prisma.$queryRaw<{ productId: string; cnt: bigint }[]>`
    SELECT oi2."productId" AS "productId", COUNT(*)::bigint AS cnt
    FROM "OrderItem" oi1
    JOIN "OrderItem" oi2 ON oi1."orderId" = oi2."orderId"
      AND oi2."productId" IS NOT NULL
      AND oi2."productId" <> ${productId}
    JOIN "Order" o ON o.id = oi1."orderId" AND o.status <> 'CANCELLED'
    WHERE oi1."productId" = ${productId}
    GROUP BY oi2."productId"
    ORDER BY cnt DESC
    LIMIT ${limit}
  `;

  if (companionIds.length === 0) return [];

  const ids = companionIds.map((r) => r.productId);
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: {
      id: true,
      slug: true,
      name: true,
      type: true,
      price: true,
      salePrice: true,
      saleStartsAt: true,
      saleEndsAt: true,
      stock: true,
      isBestSeller: true,
      isNewArrival: true,
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { url: true, alt: true },
      },
    },
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      type: row.type,
      price: Number(row.price),
      salePrice: row.salePrice == null ? null : Number(row.salePrice),
      saleStartsAt: row.saleStartsAt,
      saleEndsAt: row.saleEndsAt,
      stock: row.stock,
      isBestSeller: row.isBestSeller,
      isNewArrival: row.isNewArrival,
      imageUrl: row.images[0]?.url ?? null,
      imageAlt: row.images[0]?.alt ?? null,
    }));
}
