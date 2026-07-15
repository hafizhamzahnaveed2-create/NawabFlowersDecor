"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart, cartSubtotal } from "@/lib/cart/store";
import { formatPrice } from "@/lib/money";
import { DELIVERY_FEE } from "@/lib/delivery";

export function CartDrawer() {
  const { lines, isDrawerOpen, closeDrawer, setQuantity, removeLine } =
    useCart();
  const reducedMotion = useReducedMotion();
  const subtotal = cartSubtotal(lines);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-40 bg-ink/30"
            aria-hidden
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Shopping cart"
            initial={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "100%" }}
            transition={{ type: "tween", duration: reducedMotion ? 0 : 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-ivory shadow-bloom-lg"
          >
            <div className="flex items-center justify-between border-b border-stone px-6 py-4">
              <h2 className="font-display text-xl text-burgundy">Your cart</h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-lg p-2 hover:bg-stone/50"
                aria-label="Close cart"
              >
                <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <p className="text-lg text-ink/70">Your cart is empty.</p>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="text-sm font-medium text-sage underline-offset-4 hover:text-burgundy hover:underline"
                >
                  Keep browsing
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-stone overflow-y-auto px-6">
                  {lines.map((line) => (
                    <li key={line.key} className="flex gap-4 py-4">
                      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-stone/40">
                        {line.imageUrl && (
                          <Image
                            src={line.imageUrl}
                            alt={line.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <Link
                          href={`/product/${line.slug}`}
                          onClick={closeDrawer}
                          className="truncate font-medium hover:text-burgundy"
                        >
                          {line.name}
                        </Link>
                        {line.variantName && (
                          <p className="text-sm text-ink/60">{line.variantName}</p>
                        )}
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center rounded-lg border border-stone">
                            <button
                              type="button"
                              className="px-2.5 py-1 hover:text-burgundy"
                              onClick={() => setQuantity(line.key, line.quantity - 1)}
                              aria-label={`Decrease quantity of ${line.name}`}
                            >
                              −
                            </button>
                            <span className="min-w-7 text-center text-sm">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              className="px-2.5 py-1 hover:text-burgundy disabled:opacity-40"
                              onClick={() => setQuantity(line.key, line.quantity + 1)}
                              disabled={line.quantity >= line.maxQuantity}
                              aria-label={`Increase quantity of ${line.name}`}
                            >
                              +
                            </button>
                          </div>
                          <span className="font-medium">
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
                        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-stone px-6 py-5">
                  <div className="flex justify-between text-sm text-ink/70">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-ink/70">
                    <span>Delivery</span>
                    <span>{formatPrice(DELIVERY_FEE)}</span>
                  </div>
                  <div className="mt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(subtotal + DELIVERY_FEE)}</span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="mt-4 block rounded-lg bg-burgundy px-4 py-3 text-center font-medium text-ivory transition-colors hover:bg-burgundy-deep"
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="mt-2 block text-center text-sm font-medium text-sage underline-offset-4 hover:text-burgundy hover:underline"
                  >
                    View full cart
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
