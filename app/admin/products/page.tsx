import Link from "next/link";
import { listAdminProducts } from "@/lib/repositories/admin/products";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Products · Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const { products, total, page, pageCount } = await listAdminProducts({
    search: sp.q,
    page: sp.page ? Number(sp.page) : 1,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-burgundy">Products</h1>
          <p className="mt-1 text-ink/60">
            {total} product{total === 1 ? "" : "s"} in the catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-burgundy px-4 py-2.5 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
        >
          Add product
        </Link>
      </div>

      <form method="GET" className="mt-5 flex max-w-sm gap-2">
        <input
          type="search"
          name="q"
          defaultValue={sp.q}
          placeholder="Search by name…"
          aria-label="Search products"
          className="w-full rounded-lg border border-stone bg-white px-3.5 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-stone bg-white px-4 py-2 text-sm font-medium hover:border-sage"
        >
          Search
        </button>
      </form>

      <div className="mt-5 overflow-hidden rounded-petal border border-stone bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Status</th>
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
                    <span className="relative block h-10 w-8 shrink-0 overflow-hidden rounded bg-stone/40">
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element -- admin accepts arbitrary image URLs until blob storage lands
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
                        {p.variantCount > 0 ? ` · ${p.variantCount} variants` : ""}
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
                    {p.isBestSeller && <Badge variant="bestseller">Best seller</Badge>}
                    {p.isNewArrival && <Badge variant="new">New</Badge>}
                    {p.salePrice != null && <Badge variant="sale">Sale</Badge>}
                    {p.isFeatured && <Badge variant="muted">Featured</Badge>}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {p.isActive ? (
                    <span className="text-sage">Live</span>
                  ) : (
                    <span className="text-ink/50">Hidden</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="px-4 py-10 text-center text-ink/60">
            No products found{sp.q ? ` for “${sp.q}”` : ""}.
          </p>
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
