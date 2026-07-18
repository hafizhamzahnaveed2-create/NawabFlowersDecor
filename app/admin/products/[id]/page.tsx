import { notFound } from "next/navigation";
import { listCategories } from "@/lib/repositories/categories";
import { getAdminProduct } from "@/lib/repositories/admin/products";
import { ProductForm } from "../product-form";
import { requirePagePermission } from "../../require-page-permission";

export const metadata = { title: "Edit product · Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePagePermission("catalog.write");
  const { id } = await params;
  const [categories, product] = await Promise.all([
    listCategories(),
    getAdminProduct(id),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">{product.name}</h1>
      <p className="mt-1 text-ink/60">Edit and save — changes go live immediately.</p>
      <ProductForm categories={categories} initial={product} />
    </div>
  );
}
