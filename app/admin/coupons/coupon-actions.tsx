"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CouponDto } from "@/lib/repositories/coupons";

export function CouponRowActions({
  id,
  isActive,
  coupon,
}: {
  id: string;
  isActive: boolean;
  coupon: CouponDto;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: coupon.code,
          kind: coupon.kind,
          value: coupon.value,
          minOrderAmount: coupon.minOrderAmount,
          maxRedemptions: coupon.maxRedemptions,
          startsAt: coupon.startsAt
            ? new Date(coupon.startsAt).toISOString()
            : "",
          endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString() : "",
          isActive: !isActive,
        }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete coupon ${coupon.code}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className="text-xs font-medium text-sage hover:text-burgundy disabled:opacity-60"
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="text-xs font-medium text-ink/40 hover:text-burgundy disabled:opacity-60"
      >
        Delete
      </button>
    </div>
  );
}
