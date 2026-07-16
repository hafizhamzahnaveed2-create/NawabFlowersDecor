import Link from "next/link";
import {
  getAnalyticsSummary,
  getTopCtaClicks,
  rangeLabels,
  resolveAnalyticsRange,
} from "@/lib/repositories/admin/analytics";
import { analyticsRangeSchema } from "@/lib/validation/analytics";
import { formatPrice } from "@/lib/money";
import { AnalyticsFilters } from "./analytics-filters";
import {
  FunnelSteps,
  RevenueBars,
  StatusBars,
} from "@/components/admin/analytics-charts";

export const metadata = { title: "Analytics · Admin" };

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const parsed = analyticsRangeSchema.safeParse(sp);
  const range = resolveAnalyticsRange(
    parsed.success ? parsed.data.from : undefined,
    parsed.success ? parsed.data.to : undefined,
  );
  const labels = rangeLabels(range);

  const [summary, ctaClicks] = await Promise.all([
    getAnalyticsSummary(range),
    getTopCtaClicks(range),
  ]);

  const exportQs = `from=${labels.from}&to=${labels.to}`;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-burgundy">Analytics</h1>
          <p className="mt-1 text-ink/60">
            Revenue, funnel, and retention for {labels.from} → {labels.to}
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-sage hover:text-burgundy"
        >
          ← Ops dashboard
        </Link>
      </div>

      <AnalyticsFilters from={labels.from} to={labels.to} />

      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["orders", "Export orders"],
            ["products", "Export products"],
            ["newsletter", "Export newsletter"],
          ] as const
        ).map(([type, label]) => (
          <a
            key={type}
            href={`/api/admin/analytics/export?type=${type}&${exportQs}`}
            className="rounded-lg border border-stone bg-white px-3 py-2 text-sm font-medium hover:border-sage hover:text-burgundy"
          >
            {label}
          </a>
        ))}
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Revenue" value={formatPrice(summary.revenue)} />
        <Kpi label="Orders" value={String(summary.orders)} />
        <Kpi label="AOV" value={formatPrice(summary.aov)} />
        <Kpi
          label="Conversion"
          value={
            summary.funnel.conversionRate != null
              ? `${summary.funnel.conversionRate.toFixed(1)}%`
              : "—"
          }
          hint="Orders ÷ page views"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Daily revenue</h2>
          <RevenueBars daily={summary.daily} />
        </section>
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Order status</h2>
          <StatusBars mix={summary.statusMix} />
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Funnel</h2>
          <FunnelSteps funnel={summary.funnel} />
        </section>
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Top products</h2>
          {summary.topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">No product sales yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-stone text-sm">
              {summary.topProducts.map((p) => (
                <li
                  key={p.productId}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="shrink-0 text-ink/60">
                    {p.units} · {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Retention</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <Stat
              label="Repeat customers"
              value={String(summary.retention.repeatCustomers)}
            />
            <Stat
              label="Cart recovery"
              value={
                summary.retention.recoveryRate != null
                  ? `${summary.retention.recoveryRate.toFixed(0)}%`
                  : "—"
              }
              hint={`${summary.retention.abandonedRecovered}/${summary.retention.abandonedCarts}`}
            />
            <Stat
              label="Newsletter joins"
              value={String(summary.retention.newsletterNew)}
            />
            <Stat
              label="Unsubscribes"
              value={String(summary.retention.newsletterUnsub)}
            />
            <Stat
              label="Guest orders"
              value={String(summary.retention.guestOrders)}
            />
            <Stat
              label="Registered orders"
              value={String(summary.retention.registeredOrders)}
            />
            <Stat
              label="Coupon use"
              value={
                summary.retention.couponRate != null
                  ? `${summary.retention.couponRate.toFixed(0)}%`
                  : "—"
              }
              hint={`${summary.retention.couponOrders} orders`}
            />
            <Stat
              label="Discounts given"
              value={formatPrice(summary.discounts)}
            />
          </dl>
        </section>

        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">
            Top CTA clicks
          </h2>
          <p className="mt-1 text-sm text-ink/55">
            Lightweight click map from tracked CTAs — not a full heatmap.
          </p>
          {ctaClicks.length === 0 ? (
            <p className="mt-4 text-sm text-ink/60">
              No CTA clicks recorded in this range yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-stone text-sm">
              {ctaClicks.map((c) => (
                <li
                  key={c.label}
                  className="flex justify-between gap-3 py-2.5"
                >
                  <span className="truncate">{c.label}</span>
                  <span className="font-medium tabular-nums">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-petal border border-stone bg-white p-5">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-burgundy">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div>
      <dt className="text-ink/55">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-ink">{value}</dd>
      {hint && <p className="text-xs text-ink/45">{hint}</p>}
    </div>
  );
}
