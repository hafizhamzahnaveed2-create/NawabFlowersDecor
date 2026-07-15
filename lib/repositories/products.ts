import { prisma } from "@/lib/db";
import type { Prisma, ProductType } from "@/lib/generated/prisma/client";

// List/detail DTOs are plain serializable objects: Decimals become numbers
// before they cross into React.

export type ProductCard = {
  id: string;
  slug: string;
  name: string;
  type: ProductType;
  price: number;
  salePrice: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
  stock: number;
  isBestSeller: boolean;
  isNewArrival: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
};

export type ProductDetail = ProductCard & {
  description: string | null;
  category: { name: string; slug: string };
  subCategory: { name: string; slug: string } | null;
  images: { id: string; url: string; alt: string | null }[];
  variants: {
    id: string;
    name: string;
    price: number;
    stock: number;
  }[];
  tags: { kind: string; name: string; slug: string }[];
};

export type ProductSort = "newest" | "price-asc" | "price-desc" | "best-selling";

export type ProductFilters = {
  categorySlug?: string;
  subCategorySlug?: string;
  type?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  onSaleOnly?: boolean;
  tagSlugs?: string[];
  sort?: ProductSort;
  page?: number;
  pageSize?: number;
};

const cardSelect = {
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
    orderBy: { sortOrder: "asc" as const },
    take: 1,
    select: { url: true, alt: true },
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(row: CardRow): ProductCard {
  return {
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
  };
}

function buildWhere(filters: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.subCategorySlug)
    where.subCategory = { slug: filters.subCategorySlug };
  if (filters.type) where.type = filters.type;
  if (filters.inStockOnly) where.stock = { gt: 0 };
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {
      ...(filters.minPrice != null ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice != null ? { lte: filters.maxPrice } : {}),
    };
  }
  if (filters.onSaleOnly) {
    const now = new Date();
    where.AND = [
      { salePrice: { not: null } },
      { OR: [{ saleStartsAt: null }, { saleStartsAt: { lte: now } }] },
      { OR: [{ saleEndsAt: null }, { saleEndsAt: { gte: now } }] },
    ];
  }
  if (filters.tagSlugs?.length) {
    where.tags = { some: { tag: { slug: { in: filters.tagSlugs } } } };
  }
  return where;
}

function buildOrderBy(
  sort: ProductSort | undefined,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }];
    case "price-desc":
      return [{ price: "desc" }];
    case "best-selling":
      return [{ orderItems: { _count: "desc" } }, { createdAt: "desc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }];
  }
}

export async function listProducts(filters: ProductFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, filters.pageSize ?? 24);
  const where = buildWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: buildOrderBy(filters.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: cardSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(toCard),
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const row = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { name: true, slug: true } },
      subCategory: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { price: "asc" } },
      tags: { include: { tag: true } },
    },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type,
    description: row.description,
    price: Number(row.price),
    salePrice: row.salePrice == null ? null : Number(row.salePrice),
    saleStartsAt: row.saleStartsAt,
    saleEndsAt: row.saleEndsAt,
    stock: row.stock,
    isBestSeller: row.isBestSeller,
    isNewArrival: row.isNewArrival,
    imageUrl: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.alt ?? null,
    category: row.category,
    subCategory: row.subCategory,
    images: row.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt })),
    variants: row.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: Number(v.price),
      stock: v.stock,
    })),
    tags: row.tags.map((t) => ({
      kind: t.tag.kind,
      name: t.tag.name,
      slug: t.tag.slug,
    })),
  };
}

/**
 * Best sellers computed from real order data (delivered/paid line counts),
 * padded with manually flagged products when there isn't enough history yet.
 */
export async function getBestSellers(limit = 8): Promise<ProductCard[]> {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: { status: { not: "CANCELLED" } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });
  const orderedIds = grouped
    .map((g) => g.productId)
    .filter((id): id is string => id !== null);

  const fromOrders = orderedIds.length
    ? await prisma.product.findMany({
        where: { id: { in: orderedIds }, isActive: true },
        select: cardSelect,
      })
    : [];
  const byId = new Map(fromOrders.map((p) => [p.id, p]));
  const ranked = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is CardRow => !!p);

  if (ranked.length < limit) {
    const padding = await prisma.product.findMany({
      where: {
        isActive: true,
        isBestSeller: true,
        id: { notIn: ranked.map((p) => p.id) },
      },
      take: limit - ranked.length,
      select: cardSelect,
    });
    ranked.push(...padding);
  }
  return ranked.slice(0, limit).map(toCard);
}

export async function getNewArrivals(limit = 8): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isNewArrival: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getSaleProducts(limit = 8): Promise<ProductCard[]> {
  const now = new Date();
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      salePrice: { not: null },
      AND: [
        { OR: [{ saleStartsAt: null }, { saleStartsAt: { lte: now } }] },
        { OR: [{ saleEndsAt: null }, { saleEndsAt: { gte: now } }] },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  limit = 4,
): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      category: { slug: categorySlug },
    },
    orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}
