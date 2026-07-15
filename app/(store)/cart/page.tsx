"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, cartSubtotal } from "@/lib/cart/store";
import { formatPrice } from "@/lib/money";
import { DELIVERY_FEE } from "@/lib/delivery";
import { useHydrated } from "@/lib/use-hydrated";

export default function CartPage() {
  const { lines, setQuantity, removeLine } = useCart();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="font-display text-4xl text-burgundy">Your cart</h1>
        <div className="mt-8 h-40 animate-pulse rounded-petal bg-stone/50" />
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl text-burgundy">Your cart</h1>

      {lines.length === 0 ? (
        <div className="mt-8 rounded-petal border border-stone bg-white p-12 text-center">
          <p className="font-display text-2xl text-burgundy">
            Your cart is empty
          </p>
          <p className="mt-2 text-ink/60">
            Fill it with something beautiful.
          </p>
          <Link
            href="/category/bouquets"
            className="mt-6 inline-block rounded-lg bg-burgundy px-6 py-3 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
          >
            Shop bouquets
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <ul className="divide-y divide-stone rounded-petal border border-stone bg-white px-6">
            {lines.map((line) => (
              <li key={line.key} className="flex gap-5 py-5">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-stone/40">
                  {line.imageUrl && (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={`/product/${line.slug}`}
                    className="font-medium hover:text-burgundy"
                  >
                    {line.name}
                  </Link>
                  {line.variantName && (
                    <p className="text-sm text-ink/60">{line.variantName}</p>
                  )}
                  <p className="text-sm text-ink/60">
                    {formatPrice(line.unitPrice)} each
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-stone">
                      <button
                        type="button"
                        className="px-3 py-1.5 hover:text-burgundy"
                        onClick={() => setQuantity(line.key, line.quantity - 1)}
                        aria-label={`Decrease quantity of ${line.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        className="px-3 py-1.5 hover:text-burgundy disabled:opacity-40"
                        onClick={() => setQuantity(line.key, line.quantity + 1)}
                        disabled={line.quantity >= line.maxQuantity}
                        aria-label={`Increase quantity of ${line.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="font-semibold">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.key)}
                  className="self-start p-1 text-ink/40 hover:text-burgundy"
                  aria-label={`Remove ${line.name} from cart`}
                >
                  <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-petal border border-stone bg-white p-6">
            <h2 className="font-display text-xl text-burgundy">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/70">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink/70">Delivery</dt>
                <dd>{formatPrice(DELIVERY_FEE)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(subtotal + DELIVERY_FEE)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-5 block rounded-lg bg-burgundy px-4 py-3 text-center font-medium text-ivory transition-colors hover:bg-burgundy-deep"
            >
              Proceed to checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
