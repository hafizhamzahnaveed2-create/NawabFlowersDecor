import { requirePagePermission } from "../require-page-permission";
import { listCategoriesForAdmin } from "@/lib/repositories/admin/categories";
import { CategoriesManager } from "./categories-manager";

export const metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  await requirePagePermission("catalog.write");
  const categories = await listCategoriesForAdmin();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Categories</h1>
      <p className="mt-1 text-ink/60">
        Add and organise shop categories and sub-categories — bouquets,
        decorations, gifts, and more. They show up when you add a product.
      </p>
      <div className="mt-6">
        <CategoriesManager initialCategories={categories} />
      </div>
    </div>
  );
}
