import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomBouquetByShareToken } from "@/lib/repositories/custom-bouquets";
import { formatPrice } from "@/lib/money";
import { ShareAddToCart } from "./share-add-to-cart";

export const metadata = { title: "Shared bouquet" };

export default async function SharedBouquetPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const bouquet = await getCustomBouquetByShareToken(token);
  if (!bouquet) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-sm uppercase tracking-[0.25em] text-sage">
        Shared design
      </p>
      <h1 className="mt-2 font-display text-4xl text-burgundy">
        {bouquet.name || "Custom bouquet"}
      </h1>
      <p className="mt-2 text-lg text-ink/70">
        {formatPrice(bouquet.totalPrice)}
      </p>

      <ul className="mt-8 divide-y divide-stone rounded-petal border border-stone bg-white px-5">
        {bouquet.items.map((item, i) => (
          <li key={`${item.componentId}-${i}`} className="flex justify-between py-3 text-sm">
            <span>
              {item.componentName}
              {item.quantity > 1 ? ` × ${item.quantity}` : ""}
            </span>
            <span className="font-medium">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap gap-3">
        <ShareAddToCart bouquet={bouquet} />
        <Link
          href="/builder"
          className="rounded-lg border border-stone bg-white px-5 py-2.5 font-medium transition-colors hover:border-sage hover:text-burgundy"
        >
          Build your own
        </Link>
      </div>
    </div>
  );
}
