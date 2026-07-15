"use client";

import { useCart, cartCount } from "@/lib/cart/store";
import { useHydrated } from "@/lib/use-hydrated";

export function CartButton() {
  const lines = useCart((s) => s.lines);
  const openDrawer = useCart((s) => s.openDrawer);
  // Avoid hydration mismatch: the persisted cart only exists on the client.
  const hydrated = useHydrated();

  const count = hydrated ? cartCount(lines) : 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative rounded-lg p-2 text-ink transition-colors hover:bg-stone/50 hover:text-burgundy"
      aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <svg
        aria-hidden
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1 text-xs font-semibold text-ivory">
          {count}
        </span>
      )}
    </button>
  );
}
