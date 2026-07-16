import { formatPrice } from "@/lib/money";

export function RevenueBars({
  daily,
}: {
  daily: { day: string; orders: number; revenue: number }[];
}) {
  if (daily.length === 0) {
    return (
      <p className="mt-4 text-sm text-ink/60">No orders in this range yet.</p>
    );
  }
  const max = Math.max(...daily.map((d) => d.revenue), 1);

  return (
    <div className="mt-4 space-y-2">
      {daily.map((d) => (
        <div key={d.day} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 text-sm">
          <span className="font-mono text-xs text-ink/50">
            {d.day.slice(5)}
          </span>
          <div className="h-2.5 overflow-hidden rounded-full bg-stone/60">
            <div
              className="h-full rounded-full bg-burgundy transition-[width] duration-500"
              style={{ width: `${(d.revenue / max) * 100}%` }}
              title={formatPrice(d.revenue)}
            />
          </div>
          <span className="min-w-[5.5rem] text-right tabular-nums text-ink/80">
            {formatPrice(d.revenue)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatusBars({
  mix,
}: {
  mix: { status: string; count: number }[];
}) {
  if (mix.length === 0) {
    return <p className="mt-4 text-sm text-ink/60">No orders in this range.</p>;
  }
  const max = Math.max(...mix.map((m) => m.count), 1);
  const labels: Record<string, string> = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    OUT_FOR_DELIVERY: "Out for delivery",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };

  return (
    <ul className="mt-4 space-y-2">
      {mix.map((m) => (
        <li
          key={m.status}
          className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm"
        >
          <span className="truncate text-ink/70">
            {labels[m.status] ?? m.status}
          </span>
          <div className="h-2 overflow-hidden rounded-full bg-stone/60">
            <div
              className="h-full rounded-full bg-sage"
              style={{ width: `${(m.count / max) * 100}%` }}
            />
          </div>
          <span className="text-right font-medium tabular-nums">{m.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function FunnelSteps({
  funnel,
}: {
  funnel: {
    pageViews: number;
    productViews: number;
    addToCarts: number;
    checkoutStarts: number;
    orders: number;
  };
}) {
  const steps = [
    { label: "Page views", value: funnel.pageViews },
    { label: "Product views", value: funnel.productViews },
    { label: "Add to cart", value: funnel.addToCarts },
    { label: "Checkout start", value: funnel.checkoutStarts },
    { label: "Orders", value: funnel.orders },
  ];
  const max = Math.max(...steps.map((s) => s.value), 1);

  return (
    <ol className="mt-4 space-y-3">
      {steps.map((s) => (
        <li key={s.label}>
          <div className="flex justify-between text-sm">
            <span className="text-ink/70">{s.label}</span>
            <span className="font-medium tabular-nums">{s.value}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone/60">
            <div
              className="h-full rounded-full bg-blush"
              style={{ width: `${(s.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
