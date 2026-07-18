import Link from "next/link";
import { listAdminProducts } from "@/lib/repositories/admin/products";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductRowActions } from "./product-row-actions";
import { requirePagePermission } from "../require-page-permission";

export const metadata = { title: "Products · Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requirePagePermission("catalog.read");
  const sp = await searchParams;
  const { products, total, page, pageCount } = await listAdminProducts({
    search: sp.q,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Products"
        description={
          total === 1
            ? "1 product in your shop — add, edit, or remove anytime."
            : `${total} products in your shop — add, edit, or remove anytime.`
        }
        actionHref="/admin/products/new"
        actionLabel="+ Add product"
      />

      <form method="GET" className="mt-6 flex max-w-md gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={sp.q}
          placeholder="Search by name…"
          aria-label="Search products"
          className="mt-0"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="surface-panel mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">In shop?</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-ivory/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center gap-3 font-medium hover:text-burgundy"
                  >
                    <span className="relative block h-12 w-10 shrink-0 overflow-hidden rounded bg-stone/40">
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- admin accepts arbitrary image URLs
                        <img
                          src={p.imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">{p.name}</span>
                      <span className="block text-xs font-normal text-ink/50">
                        {p.categoryName}
                        {p.subCategoryName ? ` · ${p.subCategoryName}` : ""}
                        {p.variantCount > 0
                          ? ` · ${p.variantCount} variants`
                          : ""}
                      </span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {p.salePrice != null ? (
                    <>
                      <span className="font-medium text-burgundy">
                        {formatPrice(p.salePrice)}
                      </span>{" "}
                      <s className="text-ink/40">{formatPrice(p.price)}</s>
                    </>
                  ) : (
                    formatPrice(p.price)
                  )}
                </td>
                <td
                  className={`px-4 py-3 ${p.stock <= 5 ? "font-semibold text-burgundy" : ""}`}
                >
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <span className="flex flex-wrap gap-1">
                    {p.isBestSeller && (
                      <Badge variant="bestseller">Best seller</Badge>
                    )}
                    {p.isNewArrival && <Badge variant="new">New</Badge>}
                    {p.salePrice != null && <Badge variant="sale">Sale</Badge>}
                    {p.isFeatured && <Badge variant="muted">Featured</Badge>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.isActive ? (
                    <span className="font-medium text-sage">Yes — live</span>
                  ) : (
                    <span className="text-ink/50">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ProductRowActions
                    productId={p.id}
                    productName={p.name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-4">
            <EmptyState
              title={sp.q ? `No matches for “${sp.q}”` : "No products yet"}
              description={
                sp.q
                  ? "Try another search, or clear the filter to see everything."
                  : "Add your first bouquet, stem, or gift add-on to open the shop."
              }
              actionHref={sp.q ? undefined : "/admin/products/new"}
              actionLabel={sp.q ? undefined : "+ Add your first product"}
              className="border-0 shadow-none"
            />
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), page: String(p) })}`}
              aria-current={p === page ? "page" : undefined}
              className={`flex size-9 items-center justify-center rounded-lg border text-sm ${
                p === page
                  ? "border-burgundy bg-burgundy text-ivory"
                  : "border-stone bg-white hover:border-sage"
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
