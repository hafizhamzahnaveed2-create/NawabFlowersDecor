"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function WishlistRemoveButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await fetch(`/api/wishlist?productId=${productId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      className="mt-2 text-xs font-medium text-ink/50 underline-offset-2 hover:text-burgundy hover:underline disabled:opacity-60"
    >
      {busy ? "Removing…" : "Remove"}
    </button>
  );
}
