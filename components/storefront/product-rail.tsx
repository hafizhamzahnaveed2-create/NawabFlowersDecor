import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/repositories/products";
import { ProductCard } from "@/components/storefront/product-card";

export function ProductRail({
  title,
  subtitle,
  products,
  href,
}: {
  title: string;
  subtitle?: string;
  products: ProductCardData[];
  href?: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="page-section mx-auto max-w-6xl px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-ink/60 sm:text-base">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-sm font-medium text-sage underline-offset-4 transition-colors hover:text-burgundy hover:underline"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
