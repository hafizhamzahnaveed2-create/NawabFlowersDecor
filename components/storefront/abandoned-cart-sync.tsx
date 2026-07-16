"use client";

import { useEffect, useRef } from "react";
import { useCart, cartSubtotal } from "@/lib/cart/store";
import { useHydrated } from "@/lib/use-hydrated";

/**
 * Syncs the cart snapshot to the server when we know an email (guest field
 * or signed-in user). Debounced so typing doesn't hammer the API.
 */
export function AbandonedCartSync({
  email,
}: {
  email: string | null | undefined;
}) {
  const lines = useCart((s) => s.lines);
  const hydrated = useHydrated();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hydrated || !email || !email.includes("@")) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          cartSnapshot: {
            lines,
            subtotal: cartSubtotal(lines),
          },
        }),
      });
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [email, lines, hydrated]);

  return null;
}
