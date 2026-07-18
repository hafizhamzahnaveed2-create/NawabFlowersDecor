import Link from "next/link";
import { listAdminProducts } from "@/lib/repositories/admin/products";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-burgundy">Products</h1>
          <p className="mt-1 text-ink/60">
            {total === 1
              ? "1 product in your shop — add, edit, or remove anytime."
              : `${total} products in your shop — add, edit, or remove anytime.`}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-burgundy px-5 py-3 text-base font-semibold text-ivory shadow-bloom transition-colors hover:bg-burgundy-deep"
        >
          + Add new product
        </Link>
      </div>

      <form method="GET" className="mt-5 flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={sp.q}
          placeholder="Search by name…"
          aria-label="Search products"
          className="w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-stone bg-white px-4 py-2.5 text-sm font-medium hover:border-sage"
        >
          Search
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-petal border border-stone bg-white">
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
          <div className="px-4 py-12 text-center">
            <p className="text-ink/60">
              No products found{sp.q ? ` for “${sp.q}”` : ""}.
            </p>
            {!sp.q && (
              <Link
                href="/admin/products/new"
                className="mt-4 inline-flex rounded-lg bg-burgundy px-5 py-2.5 font-medium text-ivory hover:bg-burgundy-deep"
              >
                + Add your first product
              </Link>
            )}
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
