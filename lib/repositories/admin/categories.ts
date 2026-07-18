import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/repositories/admin/activity";
import type {
  CategoryInput,
  SubCategoryInput,
} from "@/lib/validation/categories";

export async function listCategoriesForAdmin() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      subCategories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { products: true } } },
      },
      _count: { select: { products: true } },
    },
  });
}

export async function createCategory(
  input: CategoryInput,
  userId: string | null,
) {
  const slug = (input.slug && input.slug.trim()) || slugify(input.name);
  const row = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "category.create", "Category", row.id, {
    slug: row.slug,
  });
  return row;
}

export async function updateCategory(
  id: string,
  input: CategoryInput,
  userId: string | null,
) {
  const slug = (input.slug && input.slug.trim()) || slugify(input.name);
  const row = await prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "category.update", "Category", id, {
    slug: row.slug,
  });
  return row;
}

export async function deleteCategory(id: string, userId: string | null) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(
      `This category still has ${count} product${count === 1 ? "" : "s"}. Move or remove them first, or mark the category inactive.`,
    );
  }
  await prisma.category.delete({ where: { id } });
  await logActivity(userId, "category.delete", "Category", id);
}

export async function createSubCategory(
  input: SubCategoryInput,
  userId: string | null,
) {
  const slug = (input.slug && input.slug.trim()) || slugify(input.name);
  const row = await prisma.subCategory.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      slug,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "subcategory.create", "SubCategory", row.id, {
    slug: row.slug,
  });
  return row;
}

export async function updateSubCategory(
  id: string,
  input: SubCategoryInput,
  userId: string | null,
) {
  const slug = (input.slug && input.slug.trim()) || slugify(input.name);
  const row = await prisma.subCategory.update({
    where: { id },
    data: {
      categoryId: input.categoryId,
      name: input.name,
      slug,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "subcategory.update", "SubCategory", id, {
    slug: row.slug,
  });
  return row;
}

export async function deleteSubCategory(id: string, userId: string | null) {
  const count = await prisma.product.count({ where: { subCategoryId: id } });
  if (count > 0) {
    throw new Error(
      `This sub-category still has ${count} product${count === 1 ? "" : "s"}. Move or remove them first, or mark it inactive.`,
    );
  }
  await prisma.subCategory.delete({ where: { id } });
  await logActivity(userId, "subcategory.delete", "SubCategory", id);
}
