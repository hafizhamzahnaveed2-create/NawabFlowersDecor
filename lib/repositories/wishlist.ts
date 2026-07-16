import { prisma } from "@/lib/db";

export async function listWishlist(userId: string) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          salePrice: true,
          saleStartsAt: true,
          saleEndsAt: true,
          stock: true,
          isActive: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      },
    },
  });

  return rows
    .filter((r) => r.product.isActive)
    .map((r) => ({
      id: r.id,
      productId: r.productId,
      slug: r.product.slug,
      name: r.product.name,
      price: Number(r.product.price),
      salePrice: r.product.salePrice == null ? null : Number(r.product.salePrice),
      saleStartsAt: r.product.saleStartsAt,
      saleEndsAt: r.product.saleEndsAt,
      stock: r.product.stock,
      imageUrl: r.product.images[0]?.url ?? null,
      imageAlt: r.product.images[0]?.alt ?? null,
    }));
}

export async function isInWishlist(userId: string, productId: string) {
  const row = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return !!row;
}

export async function addToWishlist(userId: string, productId: string) {
  return prisma.wishlistItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({ where: { userId, productId } });
}
