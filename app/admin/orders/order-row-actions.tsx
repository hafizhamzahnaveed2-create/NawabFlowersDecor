"use client";

import Link from "next/link";

export function OrderRowActions({ orderId }: { orderId: string }) {
  return (
    <Link
      href={`/admin/orders/${orderId}`}
      className="inline-flex rounded-lg bg-burgundy px-3 py-1.5 text-sm font-medium text-ivory hover:bg-burgundy-deep"
    >
      Open & update status
    </Link>
  );
}
