import Link from "next/link";
import { listAdminOrders } from "@/lib/repositories/admin/orders";
import { formatPrice } from "@/lib/money";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { Badge, orderStatusBadgeVariant } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrderRowActions } from "./order-row-actions";
import { requirePagePermission } from "../require-page-permission";

export const metadata = { title: "Orders · Admin" };

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PREPARING", label: "Preparing" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
];

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
  await requirePagePermission("orders.read");
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
    <div className="mx-auto max-w-6xl">
      <AdminPageHeader
        title="Orders"
        description={`${total === 1 ? "1 order" : `${total} orders`}${
          status
            ? ` · ${STATUSES.find((s) => s.value === status)?.label}`
            : ""
        } — open any order to confirm or change its status.`}
      >
        <Link
          href="/admin/orders?status=PENDING"
          className={buttonClasses("secondary", "md")}
        >
          Show pending only
        </Link>
      </AdminPageHeader>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={filterHref(undefined)}
          className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
            !status
              ? "bg-burgundy text-ivory"
              : "border border-stone bg-surface hover:border-sage"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s.value}
            href={filterHref(s.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
              status === s.value
                ? "bg-burgundy text-ivory"
                : "border border-stone bg-surface hover:border-sage"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <form method="GET" className="mt-4 flex max-w-md gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <Input
          type="search"
          name="q"
          defaultValue={sp.q}
          placeholder="Order #, recipient, phone…"
          aria-label="Search orders"
          className="mt-0"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="surface-panel mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatPrice(o.total)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={orderStatusBadgeVariant(o.status)}>
                    {STATUSES.find((s) => s.value === o.status)?.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <OrderRowActions orderId={o.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="p-4">
            <EmptyState
              title="No orders found"
              description={
                status || sp.q
                  ? "Try another status filter or search term."
                  : "New customer orders will appear here as soon as they checkout."
              }
              className="border-0 shadow-none"
            />
          </div>
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
