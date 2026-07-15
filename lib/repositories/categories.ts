import { prisma } from "@/lib/db";

export type CategoryNav = {
  id: string;
  name: string;
  slug: string;
  subCategories: { id: string; name: string; slug: string }[];
};

export async function listCategories(): Promise<CategoryNav[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      subCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });
  return categories;
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      subCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
    },
  });
}

export async function getSubCategoryBySlug(slug: string) {
  return prisma.subCategory.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  });
}
