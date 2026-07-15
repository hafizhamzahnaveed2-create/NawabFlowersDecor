"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

const STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export function StatusUpdater({
  orderId,
  current,
}: {
  orderId: string;
  current: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not update the status");
      }
    },
    onSuccess: () => router.refresh(),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div>
      <label
        htmlFor="order-status"
        className="block text-xs uppercase tracking-wider text-ink/50"
      >
        Order status
      </label>
      <select
        id="order-status"
        value={current}
        disabled={mutation.isPending}
        onChange={(e) => {
          setError(null);
          const next = e.target.value;
          if (
            next === "CANCELLED" &&
            !confirm("Cancel this order? The customer should be told separately.")
          ) {
            return;
          }
          mutation.mutate(next);
        }}
        className="mt-1.5 rounded-lg border border-stone bg-white px-3.5 py-2.5 font-medium disabled:opacity-60"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-burgundy">
          {error}
        </p>
      )}
    </div>
  );
}
