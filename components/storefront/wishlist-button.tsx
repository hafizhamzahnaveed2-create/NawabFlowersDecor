"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export function WishlistButton({
  productId,
  initialInWishlist = false,
  loginCallback = "/",
}: {
  productId: string;
  initialInWishlist?: boolean;
  loginCallback?: string;
}) {
  const { data: session, status } = useSession();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [busy, setBusy] = useState(false);

  if (status === "unauthenticated") {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(loginCallback)}`}
        className="rounded-lg border border-stone bg-white px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-sage hover:text-burgundy"
      >
        Save to wishlist
      </Link>
    );
  }

  if (status !== "authenticated" || !session) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (inWishlist) {
        await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
        setInWishlist(false);
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setInWishlist(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        inWishlist
          ? "border-burgundy bg-burgundy/5 text-burgundy"
          : "border-stone bg-white text-ink hover:border-sage hover:text-burgundy"
      }`}
      aria-pressed={inWishlist}
    >
      {inWishlist ? "Saved to wishlist" : "Save to wishlist"}
    </button>
  );
}
