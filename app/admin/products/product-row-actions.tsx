"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductRowActions({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (
      !confirm(
        `Delete “${productName}” permanently?\n\nPast orders keep their records. This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not delete this product");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href={`/admin/products/${productId}`}
          className="rounded-lg border border-stone bg-white px-3 py-1.5 text-sm font-medium hover:border-sage hover:text-burgundy"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={deleting}
          onClick={handleDelete}
          className="rounded-lg border border-burgundy/30 bg-white px-3 py-1.5 text-sm font-medium text-burgundy hover:bg-burgundy/5 disabled:opacity-60"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-burgundy">
          {error}
        </p>
      )}
    </div>
  );
}
