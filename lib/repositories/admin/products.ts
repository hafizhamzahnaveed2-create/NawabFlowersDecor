import { prisma } from "@/lib/db";
import type { ProductFormInput } from "@/lib/validation/admin";
import { logActivity } from "@/lib/repositories/admin/activity";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "product";
  let candidate = base;
  for (let i = 2; ; i++) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${base}-${i}`;
  }
}

/** Date-only string -> UTC midnight, consistent with delivery dates. */
function toUtcDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00Z`) : null;
}

export async function listAdminProducts(options: {
  search?: string;
  page?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = 20;
  const where = options.search
    ? { name: { contains: options.search, mode: "insensitive" as const } }
    : {};

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        price: true,
        salePrice: true,
        stock: true,
        isActive: true,
        isBestSeller: true,
        isNewArrival: true,
        isFeatured: true,
        updatedAt: true,
        category: { select: { name: true } },
        subCategory: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        _count: { select: { variants: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      type: r.type,
      price: Number(r.price),
      salePrice: r.salePrice == null ? null : Number(r.salePrice),
      stock: r.stock,
      isActive: r.isActive,
      isBestSeller: r.isBestSeller,
      isNewArrival: r.isNewArrival,
      isFeatured: r.isFeatured,
      updatedAt: r.updatedAt,
      categoryName: r.category.name,
      subCategoryName: r.subCategory?.name ?? null,
      imageUrl: r.images[0]?.url ?? null,
      variantCount: r._count.variants,
    })),
    total,
    page,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function getAdminProduct(id: string) {
  const p = await prisma.product.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: { orderBy: { price: "asc" } },
    },
  });
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    type: p.type,
    description: p.description ?? "",
    categoryId: p.categoryId,
    subCategoryId: p.subCategoryId,
    sku: p.sku,
    price: Number(p.price),
    salePrice: p.salePrice == null ? null : Number(p.salePrice),
    saleStartsAt: p.saleStartsAt?.toISOString().slice(0, 10) ?? null,
    saleEndsAt: p.saleEndsAt?.toISOString().slice(0, 10) ?? null,
    stock: p.stock,
    isBestSeller: p.isBestSeller,
    isNewArrival: p.isNewArrival,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt ?? "" })),
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: Number(v.price),
      stock: v.stock,
    })),
  };
}

export async function createProduct(input: ProductFormInput, actorId: string) {
  const slug = await uniqueSlug(input.name);
  const product = await prisma.product.create({
    data: {
      name: input.name,
      slug,
      type: input.type,
      description: input.description || null,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
      sku: input.sku,
      price: input.price,
      salePrice: input.salePrice,
      saleStartsAt: toUtcDate(input.saleStartsAt),
      saleEndsAt: toUtcDate(input.saleEndsAt),
      stock: input.stock,
      isBestSeller: input.isBestSeller,
      isNewArrival: input.isNewArrival,
      isFeatured: input.isFeatured,
      isActive: input.isActive,
      images: {
        create: input.images.map((img, index) => ({
          url: img.url,
          alt: img.alt || null,
          sortOrder: index,
        })),
      },
      variants: {
        create: input.variants.map((v) => ({
          name: v.name,
          price: v.price,
          stock: v.stock,
        })),
      },
    },
    select: { id: true, name: true },
  });
  await logActivity(actorId, "product.create", "Product", product.id, {
    name: product.name,
  });
  return product;
}

export async function updateProduct(
  id: string,
  input: ProductFormInput,
  actorId: string,
) {
  const slug = await uniqueSlug(input.name, id);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: {
        name: input.name,
        slug,
        type: input.type,
        description: input.description || null,
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        sku: input.sku,
        price: input.price,
        salePrice: input.salePrice,
        saleStartsAt: toUtcDate(input.saleStartsAt),
        saleEndsAt: toUtcDate(input.saleEndsAt),
        stock: input.stock,
        isBestSeller: input.isBestSeller,
        isNewArrival: input.isNewArrival,
        isFeatured: input.isFeatured,
        isActive: input.isActive,
      },
      select: { id: true, name: true },
    });

    // Images are simple rows: replace wholesale.
    await tx.productImage.deleteMany({ where: { productId: id } });
    if (input.images.length) {
      await tx.productImage.createMany({
        data: input.images.map((img, index) => ({
          productId: id,
          url: img.url,
          alt: img.alt || null,
          sortOrder: index,
        })),
      });
    }

    // Variants are referenced by order items — preserve ids where possible.
    const keptIds = input.variants
      .map((v) => v.id)
      .filter((vid): vid is string => !!vid);
    await tx.productVariant.deleteMany({
      where: { productId: id, id: { notIn: keptIds } },
    });
    for (const variant of input.variants) {
      if (variant.id) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: { name: variant.name, price: variant.price, stock: variant.stock },
        });
      } else {
        await tx.productVariant.create({
          data: {
            productId: id,
            name: variant.name,
            price: variant.price,
            stock: variant.stock,
          },
        });
      }
    }

    await logActivity(actorId, "product.update", "Product", id, {
      name: product.name,
    }, tx);
    return product;
  });
}

export async function deleteProduct(id: string, actorId: string) {
  const product = await prisma.product.delete({
    where: { id },
    select: { name: true },
  });
  await logActivity(actorId, "product.delete", "Product", id, {
    name: product.name,
  });
}
