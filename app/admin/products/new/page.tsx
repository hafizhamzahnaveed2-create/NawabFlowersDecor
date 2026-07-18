import { listCategories } from "@/lib/repositories/categories";
import { ProductForm } from "../product-form";
import { requirePagePermission } from "../../require-page-permission";

export const metadata = { title: "Add product · Admin" };

export default async function NewProductPage() {
  await requirePagePermission("catalog.write");
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Add a product</h1>
      <p className="mt-1 text-ink/60">
        Fill in the essentials and publish — everything can be edited later.
      </p>
      <ProductForm categories={categories} />
    </div>
  );
}
