import Link from "next/link";
import { headers } from "next/headers";
import { getDashboardData } from "@/lib/repositories/admin/dashboard";
import { formatPrice } from "@/lib/money";
import { Badge, orderStatusBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAnyPagePermission } from "./require-page-permission";

export const metadata = { title: "Dashboard · Admin" };

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const sp = await searchParams;
  if (sp.denied === "1") {
    return (
      <div className="mx-auto max-w-lg">
        <EmptyState
          title="Access limited"
          description="You don’t have permission for that page. Use the menu for areas you can open, or ask an admin to update your role."
          actionHref="/admin"
          actionLabel="Back to dashboard"
        />
      </div>
    );
  }

  await requireAnyPagePermission(
    "orders.read",
    "catalog.read",
    "analytics.read",
  );
  const data = await getDashboardData();
  const hdrs = await headers();
  // Prefer Pakistan shop hours when timezone header is missing.
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: hdrs.get("x-vercel-ip-timezone") ?? "Asia/Karachi",
    }).format(new Date()),
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-burgundy">
            {greetingForHour(hour)}
          </h1>
          <p className="mt-1 text-ink/60">
            Here&apos;s what needs your attention today.
          </p>
        </div>
      </div>

      {/* Day-to-day actions — always visible */}
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link
          href="/admin/products/new"
          className="rounded-petal border border-burgundy/20 bg-burgundy px-5 py-4 text-ivory shadow-bloom transition-colors hover:bg-burgundy-deep"
        >
          <span className="block font-display text-lg">Add a product</span>
          <span className="mt-1 block text-sm text-ivory/80">
            New bouquet, stem, or gift add-on
          </span>
        </Link>
        <Link
          href="/admin/orders?status=PENDING"
          className="rounded-petal border border-stone bg-white px-5 py-4 transition-colors hover:border-burgundy/40"
        >
          <span className="block font-display text-lg text-burgundy">
            Confirm orders
          </span>
          <span className="mt-1 block text-sm text-ink/60">
            {data.pendingCount === 1
              ? "1 waiting for confirmation"
              : `${data.pendingCount} waiting for confirmation`}
          </span>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-petal border border-stone bg-white px-5 py-4 transition-colors hover:border-burgundy/40"
        >
          <span className="block font-display text-lg text-burgundy">
            Manage inventory
          </span>
          <span className="mt-1 block text-sm text-ink/60">
            Edit prices, stock, and photos
          </span>
        </Link>
      </section>

      {/* Today's deliveries — the first thing a florist checks */}
      <section className="surface-panel mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-burgundy">
            Today&apos;s deliveries
          </h2>
          <span className="rounded-full bg-blush/50 px-3 py-1 text-sm font-semibold text-burgundy-deep">
            {data.todaysDeliveries.length}
          </span>
        </div>
        {data.todaysDeliveries.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-ink/60">
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
                  <Badge variant={orderStatusBadgeVariant(d.status)}>
                    {statusLabels[d.status]}
                  </Badge>
                  <span className="text-sm font-semibold text-burgundy">
                    Update status →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="surface-panel p-5">
          <p className="text-sm text-ink/60">Revenue this month</p>
          <p className="mt-1 font-display text-2xl text-burgundy">
            {formatPrice(data.monthRevenue)}
          </p>
        </div>
        <div className="surface-panel p-5">
          <p className="text-sm text-ink/60">Orders this month</p>
          <p className="mt-1 font-display text-2xl text-ink">{data.monthOrders}</p>
        </div>
        <Link
          href="/admin/orders?status=PENDING"
          className="surface-panel p-5 transition-[border-color,box-shadow] hover:shadow-bloom-lg"
        >
          <p className="text-sm text-ink/60">Awaiting confirmation</p>
          <p className="mt-1 font-display text-2xl text-ink">{data.pendingCount}</p>
          <p className="mt-1 text-sm font-medium text-burgundy">
            Review pending orders →
          </p>
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl text-burgundy">Low stock</h2>
            <Link
              href="/admin/products"
              className="text-sm font-medium text-burgundy hover:underline"
            >
              All products
            </Link>
          </div>
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
                    <span className="ml-3 flex shrink-0 items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          p.stock === 0 ? "text-burgundy" : "text-ink/70"
                        }`}
                      >
                        {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                      </span>
                      <span className="text-sm font-medium text-burgundy">
                        Edit →
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent orders */}
        <section className="surface-panel p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl text-burgundy">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-burgundy hover:underline"
            >
              All orders
            </Link>
          </div>
          {data.recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-ink/60">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone/80">
              {data.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 py-2.5 hover:text-burgundy"
                  >
                    <span className="text-sm font-medium">{o.orderNumber}</span>
                    <span className="truncate text-sm text-ink/70">
                      {o.recipientName}
                    </span>
                    <span className="text-sm font-medium">
                      {formatPrice(o.total)}
                    </span>
                    <Badge variant={orderStatusBadgeVariant(o.status)}>
                      {statusLabels[o.status]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
