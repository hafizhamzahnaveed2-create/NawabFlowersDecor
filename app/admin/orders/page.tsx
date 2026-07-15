import Link from "next/link";
import { listAdminOrders } from "@/lib/repositories/admin/orders";
import { formatPrice } from "@/lib/money";
import type { OrderStatus } from "@/lib/generated/prisma/client";

export const metadata = { title: "Orders · Admin" };

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

const statusStyles: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-blush text-burgundy-deep",
  PREPARING: "bg-sage/20 text-sage",
  OUT_FOR_DELIVERY: "bg-sage/20 text-sage",
  DELIVERED: "bg-sage text-ivory",
  CANCELLED: "bg-stone text-ink/60",
};

const deliveryDateFormatter = new Intl.DateTimeFormat("en-PK", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUSES.find((s) => s.value === sp.status)?.value;
  const { orders, total, page, pageCount } = await listAdminOrders({
    status,
    search: sp.q,
    page: sp.page ? Number(sp.page) : 1,
  });

  const filterHref = (s?: OrderStatus) =>
    `/admin/orders?${new URLSearchParams({
      ...(s ? { status: s } : {}),
      ...(sp.q ? { q: sp.q } : {}),
    })}`;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl text-burgundy">Orders</h1>
      <p className="mt-1 text-ink/60">
        {total} order{total === 1 ? "" : "s"}
        {status ? ` · ${STATUSES.find((s) => s.value === status)?.label}` : ""} —
        sorted by soonest delivery
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={filterHref(undefined)}
          className={`rounded-full px-3.5 py-1.5 text-sm ${
            !status ? "bg-burgundy text-ivory" : "border border-stone bg-white hover:border-sage"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={filterHref(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm ${
              status === s.value
                ? "bg-burgundy text-ivory"
                : "border border-stone bg-white hover:border-sage"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <form method="GET" className="mt-4 flex max-w-sm gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input
          type="search"
          name="q"
          defaultValue={sp.q}
          placeholder="Order #, recipient, phone…"
          aria-label="Search orders"
          className="w-full rounded-lg border border-stone bg-white px-3.5 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-stone bg-white px-4 py-2 text-sm font-medium hover:border-sage"
        >
          Search
        </button>
      </form>

      <div className="mt-5 overflow-hidden rounded-petal border border-stone bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-ivory/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="font-medium hover:text-burgundy"
                  >
                    {o.orderNumber}
                  </Link>
                  <span className="block text-xs text-ink/50">
                    {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-medium">
                    {deliveryDateFormatter.format(o.deliveryDate)}
                  </span>
                  <span className="block text-xs text-ink/50">
                    {o.deliveryTimeSlot}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {o.recipientName}
                  <span className="block text-xs text-ink/50">{o.city}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatPrice(o.total)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[o.status]}`}
                  >
                    {STATUSES.find((s) => s.value === o.status)?.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <p className="px-4 py-10 text-center text-ink/60">No orders found.</p>
        )}
      </div>

      {pageCount > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/orders?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(sp.q ? { q: sp.q } : {}),
                page: String(p),
              })}`}
              aria-current={p === page ? "page" : undefined}
              className={`flex size-9 items-center justify-center rounded-lg border text-sm ${
                p === page
                  ? "border-burgundy bg-burgundy text-ivory"
                  : "border-stone bg-white hover:border-sage"
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
