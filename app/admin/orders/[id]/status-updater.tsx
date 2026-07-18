"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

const STATUSES = [
  { value: "PENDING", label: "Pending", hint: "New order — not yet confirmed" },
  { value: "CONFIRMED", label: "Confirmed", hint: "Customer knows it’s booked" },
  {
    value: "PREPARING",
    label: "Preparing",
    hint: "You’re making the arrangement",
  },
  {
    value: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    hint: "On the way to the recipient",
  },
  { value: "DELIVERED", label: "Delivered", hint: "Handed over successfully" },
  { value: "CANCELLED", label: "Cancelled", hint: "Order will not go out" },
] as const;

type HistoryEntry = {
  id: string;
  status: string;
  createdAt: string;
  actorEmail: string | null;
};

export function StatusUpdater({
  orderId,
  current,
  history = [],
}: {
  orderId: string;
  current: string;
  history?: HistoryEntry[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  function choose(next: string) {
    if (next === current || mutation.isPending) return;
    setError(null);
    if (
      next === "CANCELLED" &&
      !confirm("Cancel this order? Tell the customer separately if needed.")
    ) {
      return;
    }
    mutation.mutate(next);
  }

  const currentLabel =
    STATUSES.find((s) => s.value === current)?.label ?? current;

  return (
    <section className="rounded-petal border-2 border-burgundy/25 bg-white p-5 shadow-bloom">
      <h2 className="font-display text-xl text-burgundy">Update order status</h2>
      <p className="mt-1 text-sm text-ink/65">
        Current status:{" "}
        <span className="font-semibold text-ink">{currentLabel}</span>
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {STATUSES.map((s) => {
          const active = s.value === current;
          return (
            <button
              key={s.value}
              type="button"
              disabled={mutation.isPending || active}
              onClick={() => choose(s.value)}
              className={`rounded-lg border px-3.5 py-3 text-left transition-colors ${
                active
                  ? "border-burgundy bg-burgundy text-ivory"
                  : "border-stone bg-ivory hover:border-burgundy hover:bg-blush/40"
              } disabled:cursor-default disabled:opacity-100`}
            >
              <span className="block text-sm font-semibold">{s.label}</span>
              <span
                className={`mt-0.5 block text-xs ${active ? "text-ivory/80" : "text-ink/55"}`}
              >
                {active ? "Current status" : s.hint}
              </span>
            </button>
          );
        })}
      </div>

      {mutation.isPending && (
        <p className="mt-3 text-sm text-ink/60">Saving new status…</p>
      )}
      {saved && !mutation.isPending && (
        <p className="mt-3 text-sm font-medium text-sage" role="status">
          Status updated and logged.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-burgundy">
          {error}
        </p>
      )}

      {history.length > 0 && (
        <div className="mt-5 border-t border-stone pt-4">
          <h3 className="text-sm font-semibold text-ink">Status history</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap gap-x-2 text-ink/70">
                <span className="font-medium text-ink">
                  {STATUSES.find((s) => s.value === h.status)?.label ?? h.status}
                </span>
                <span>·</span>
                <time dateTime={h.createdAt}>
                  {new Date(h.createdAt).toLocaleString("en-PK", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </time>
                {h.actorEmail && (
                  <>
                    <span>·</span>
                    <span>{h.actorEmail}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
