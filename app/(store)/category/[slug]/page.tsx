import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/lib/repositories/categories";
import {
  listProducts,
  type ProductSort,
} from "@/lib/repositories/products";
import { ProductCard } from "@/components/storefront/product-card";

type SearchParams = {
  sub?: string;
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  onSale?: string;
  page?: string;
};

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "best-selling", label: "Best selling" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

function parseSort(value: string | undefined): ProductSort {
  return SORT_OPTIONS.some((o) => o.value === value)
    ? (value as ProductSort)
    : "best-selling";
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sort = parseSort(sp.sort);
  const activeSub = category.subCategories.find((s) => s.slug === sp.sub);

  const { products, total, page, pageCount } = await listProducts({
    categorySlug: slug,
    subCategorySlug: activeSub?.slug,
    sort,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
    inStockOnly: sp.inStock === "true",
    onSaleOnly: sp.onSale === "true",
    page: sp.page ? Number(sp.page) : 1,
  });

  function pageHref(p: number) {
    const q = new URLSearchParams();
    if (sp.sub) q.set("sub", sp.sub);
    if (sp.sort) q.set("sort", sp.sort);
    if (sp.minPrice) q.set("minPrice", sp.minPrice);
    if (sp.maxPrice) q.set("maxPrice", sp.maxPrice);
    if (sp.inStock) q.set("inStock", sp.inStock);
    if (sp.onSale) q.set("onSale", sp.onSale);
    q.set("page", String(p));
    return `/category/${slug}?${q.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-ink/60">
        <Link href="/" className="hover:text-burgundy">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{category.name}</span>
        {activeSub && (
          <>
            <span className="mx-2">/</span>
            <span className="text-ink">{activeSub.name}</span>
          </>
        )}
      </nav>

      <h1 className="mt-3 font-display text-4xl text-burgundy">
        {activeSub ? activeSub.name : category.name}
      </h1>
      {category.description && !activeSub && (
        <p className="mt-2 max-w-2xl text-ink/70">{category.description}</p>
      )}

      {/* Sub-category chips */}
      {category.subCategories.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/category/${slug}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              !activeSub
                ? "border-burgundy bg-burgundy text-ivory"
                : "border-stone bg-white hover:border-sage"
            }`}
          >
            All
          </Link>
          {category.subCategories.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${slug}?sub=${sub.slug}`}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                activeSub?.id === sub.id
                  ? "border-burgundy bg-burgundy text-ivory"
                  : "border-stone bg-white hover:border-sage"
              }`}
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* Filters — plain GET form, no client JS required */}
        <form
          method="GET"
          className="h-fit rounded-petal border border-stone bg-white p-5"
        >
          {sp.sub && <input type="hidden" name="sub" value={sp.sub} />}
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sage">
            Filter & sort
          </h2>

          <label htmlFor="sort" className="mt-4 block text-sm font-medium">
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3 py-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <p className="mt-4 text-sm font-medium">Price (PKR)</p>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              name="minPrice"
              min={0}
              placeholder="Min"
              defaultValue={sp.minPrice}
              aria-label="Minimum price"
              className="w-full rounded-lg border border-stone px-3 py-2 text-sm"
            />
            <span className="text-ink/40">–</span>
            <input
              type="number"
              name="maxPrice"
              min={0}
              placeholder="Max"
              defaultValue={sp.maxPrice}
              aria-label="Maximum price"
              className="w-full rounded-lg border border-stone px-3 py-2 text-sm"
            />
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="inStock"
              value="true"
              defaultChecked={sp.inStock === "true"}
              className="size-4 rounded border-stone accent-burgundy"
            />
            In stock only
          </label>
          <label className="mt-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="onSale"
              value="true"
              defaultChecked={sp.onSale === "true"}
              className="size-4 rounded border-stone accent-burgundy"
            />
            On sale
          </label>

          <button
            type="submit"
            className="mt-5 w-full rounded-lg bg-burgundy px-4 py-2 text-sm font-medium text-ivory transition-colors hover:bg-burgundy-deep"
          >
            Apply
          </button>
        </form>

        <div>
          <p className="text-sm text-ink/60" aria-live="polite">
            {total} product{total === 1 ? "" : "s"}
          </p>
          {products.length === 0 ? (
            <div className="mt-10 rounded-petal border border-stone bg-white p-12 text-center">
              <p className="font-display text-2xl text-burgundy">
                Nothing here yet
              </p>
              <p className="mt-2 text-ink/60">
                Try loosening the filters, or browse another collection.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-10 flex items-center justify-center gap-2"
            >
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`flex size-9 items-center justify-center rounded-lg border text-sm transition-colors ${
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
      </div>
    </div>
  );
}
