import Link from "next/link";
import { getDashboardData } from "@/lib/repositories/admin/dashboard";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Dashboard · Admin" };

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function AdminDashboard() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-burgundy">Good morning</h1>
          <p className="mt-1 text-ink/60">
            Here&apos;s what needs your attention today.
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="rounded-lg border border-stone bg-white px-4 py-2 text-sm font-medium hover:border-sage hover:text-burgundy"
        >
          Open analytics
        </Link>
      </div>

      {/* Today's deliveries — the first thing a florist checks */}
      <section className="mt-6 rounded-petal border border-stone bg-white p-6 shadow-bloom">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-burgundy">
            Today&apos;s deliveries
          </h2>
          <span className="rounded-full bg-blush px-3 py-1 text-sm font-semibold text-burgundy-deep">
            {data.todaysDeliveries.length}
          </span>
        </div>
        {data.todaysDeliveries.length === 0 ? (
          <p className="mt-3 text-ink/60">
            Nothing due today. {data.upcomingCount} deliver
            {data.upcomingCount === 1 ? "y" : "ies"} coming up this week.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone">
            {data.todaysDeliveries.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/orders/${d.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-burgundy"
                >
                  <span className="font-medium">{d.deliveryTimeSlot}</span>
                  <span>
                    {d.recipientName} · {d.area ? `${d.area}, ` : ""}
                    {d.city}
                  </span>
                  <span className="text-sm text-ink/60">{d.orderNumber}</span>
                  <Badge variant="muted">{statusLabels[d.status]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-petal border border-stone bg-white p-5">
          <p className="text-sm text-ink/60">Revenue this month</p>
          <p className="mt-1 text-2xl font-semibold text-burgundy">
            {formatPrice(data.monthRevenue)}
          </p>
        </div>
        <div className="rounded-petal border border-stone bg-white p-5">
          <p className="text-sm text-ink/60">Orders this month</p>
          <p className="mt-1 text-2xl font-semibold">{data.monthOrders}</p>
        </div>
        <div className="rounded-petal border border-stone bg-white p-5">
          <p className="text-sm text-ink/60">Awaiting confirmation</p>
          <p className="mt-1 text-2xl font-semibold">{data.pendingCount}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Low stock */}
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Low stock</h2>
          {data.lowStock.length === 0 ? (
            <p className="mt-3 text-ink/60">All products are well stocked.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center justify-between py-2.5 hover:text-burgundy"
                  >
                    <span className="truncate">{p.name}</span>
                    <span
                      className={`ml-3 shrink-0 text-sm font-semibold ${
                        p.stock === 0 ? "text-burgundy" : "text-ink/70"
                      }`}
                    >
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent orders */}
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Recent orders</h2>
          <ul className="mt-3 divide-y divide-stone">
            {data.recentOrders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between gap-2 py-2.5 hover:text-burgundy"
                >
                  <span className="text-sm">{o.orderNumber}</span>
                  <span className="truncate text-sm text-ink/70">
                    {o.recipientName}
                  </span>
                  <span className="text-sm font-medium">
                    {formatPrice(o.total)}
                  </span>
                  <Badge variant={o.status === "DELIVERED" ? "new" : "muted"}>
                    {statusLabels[o.status]}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
