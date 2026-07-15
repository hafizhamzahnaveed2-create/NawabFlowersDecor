import Image from "next/image";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/repositories/admin/orders";
import { formatPrice } from "@/lib/money";
import { StatusUpdater } from "./status-updater";

export const metadata = { title: "Order · Admin" };

const deliveryDateFormatter = new Intl.DateTimeFormat("en-PK", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const placedAtFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-burgundy">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-ink/60">
            Placed {placedAtFormatter.format(order.createdAt)}
            {order.customerEmail ? ` · ${order.customerEmail}` : ""}
          </p>
        </div>
        <StatusUpdater orderId={order.id} current={order.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Items */}
          <section className="rounded-petal border border-stone bg-white p-6">
            <h2 className="font-display text-xl text-burgundy">Items</h2>
            <ul className="mt-4 divide-y divide-stone">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 py-3">
                  <span className="relative block h-16 w-13 shrink-0 overflow-hidden rounded-lg bg-stone/40">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt=""
                        fill
                        sizes="52px"
                        className="object-cover"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.nameSnapshot}</p>
                    <p className="text-sm text-ink/60">
                      {item.quantity} × {formatPrice(item.unitPrice)}
                    </p>
                    {item.customComponents && (
                      <ul className="mt-1 text-sm text-ink/60">
                        {item.customComponents.map((c, i) => (
                          <li key={i}>
                            {c.quantity} × {c.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="font-medium">{formatPrice(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-stone pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/60">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink/60">Discount</dt>
                  <dd>-{formatPrice(order.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink/60">Delivery</dt>
                <dd>{formatPrice(order.deliveryFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-stone pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>

          {/* Gift message */}
          {order.giftMessage && (
            <section className="rounded-petal border border-stone bg-blush/30 p-6">
              <h2 className="font-display text-xl text-burgundy">
                Card message
              </h2>
              <p className="mt-3 whitespace-pre-wrap font-display text-lg italic text-ink/80">
                “{order.giftMessage}”
              </p>
              <p className="mt-2 text-xs text-ink/50">
                Hand-write this on the card exactly as shown.
              </p>
            </section>
          )}
        </div>

        {/* Delivery details */}
        <aside className="space-y-6">
          <section className="rounded-petal border border-stone bg-white p-6">
            <h2 className="font-display text-xl text-burgundy">Delivery</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-ink/50">Date & time</dt>
                <dd className="mt-0.5 font-medium">
                  {deliveryDateFormatter.format(order.deliveryDate)}
                  <span className="block font-normal">{order.deliveryTimeSlot}</span>
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">Recipient</dt>
                <dd className="mt-0.5">
                  {order.recipientName}
                  <span className="block">{order.recipientPhone}</span>
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">Address</dt>
                <dd className="mt-0.5">
                  {order.addressLine1}
                  {order.addressLine2 && <span className="block">{order.addressLine2}</span>}
                  <span className="block">
                    {order.area ? `${order.area}, ` : ""}
                    {order.city}
                    {order.postalCode ? ` ${order.postalCode}` : ""}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-petal border border-stone bg-white p-6">
            <h2 className="font-display text-xl text-burgundy">Payment</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-ink/50">Method</dt>
                <dd className="mt-0.5">
                  {order.paymentMethod === "COD"
                    ? "Cash on delivery"
                    : order.paymentMethod}
                </dd>
              </div>
              <div>
                <dt className="text-ink/50">Status</dt>
                <dd className="mt-0.5">
                  {order.paymentStatus === "PAID" ? "Paid" : "Unpaid"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
