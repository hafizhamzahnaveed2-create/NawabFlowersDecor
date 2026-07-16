import Link from "next/link";
import { SaleCountdown } from "@/components/storefront/sale-countdown";
import type { ProductCard } from "@/lib/repositories/products";

/** Homepage flash-sale strip — countdown to the soonest sale end among products. */
export function FlashSaleStrip({ products }: { products: ProductCard[] }) {
  const withEnd = products.filter((p) => p.saleEndsAt);
  if (withEnd.length === 0) return null;

  const soonest = withEnd.reduce((a, b) =>
    (a.saleEndsAt as Date).getTime() < (b.saleEndsAt as Date).getTime()
      ? a
      : b,
  );

  return (
    <section className="border-y border-stone bg-burgundy/5">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <h2 className="font-display text-2xl text-burgundy">Flash sale</h2>
          <p className="mt-0.5 text-sm text-ink/60">
            Timed offers on selected bouquets and stems
          </p>
        </div>
        <SaleCountdown
          endsAt={soonest.saleEndsAt!}
          label="Ends in"
          className="rounded-lg border border-stone bg-white px-4 py-2"
        />
        <Link
          href="/category/bouquets?onSale=true"
          className="rounded-lg bg-burgundy px-4 py-2.5 text-sm font-medium text-ivory hover:bg-burgundy-deep"
        >
          Shop sale
        </Link>
      </div>
    </section>
  );
}
