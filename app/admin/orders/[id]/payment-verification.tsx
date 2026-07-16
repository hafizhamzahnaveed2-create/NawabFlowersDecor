"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PaymentVerificationPanel({
  orderId,
  status,
  transactionId,
  receiptImageUrl,
  accountName,
}: {
  orderId: string;
  status: string;
  transactionId: string | null;
  receiptImageUrl: string | null;
  accountName: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (status === "NOT_REQUIRED") return null;

  async function decide(decision: "VERIFIED" | "REJECTED") {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-petal border border-stone bg-white p-6">
      <h2 className="font-display text-xl text-burgundy">Payment proof</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Method</dt>
          <dd className="font-medium">{accountName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Status</dt>
          <dd className="font-medium">{status}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink/60">Transaction ID</dt>
          <dd className="font-mono text-sm">{transactionId ?? "—"}</dd>
        </div>
      </dl>
      {receiptImageUrl && (
        <a
          href={receiptImageUrl}
          target="_blank"
          rel="noreferrer"
          className="relative mt-4 block aspect-[4/3] max-w-xs overflow-hidden rounded-lg border border-stone"
        >
          <Image
            src={receiptImageUrl}
            alt="Payment receipt"
            fill
            className="object-contain bg-stone/30"
            unoptimized
          />
        </a>
      )}
      {status === "PENDING" && (
        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            disabled={busy}
            onClick={() => decide("VERIFIED")}
          >
            Verify payment
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => decide("REJECTED")}
          >
            Reject
          </Button>
        </div>
      )}
    </section>
  );
}
