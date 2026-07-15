import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrderByNumber } from "@/lib/repositories/orders";
import { formatPrice } from "@/lib/money";

export const metadata = { title: "Order confirmed" };

const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

// deliveryDate is a date-only column stored at UTC midnight; format in UTC
// so it never shifts across the day boundary in local time.
const deliveryDateFormatter = new Intl.DateTimeFormat("en-PK", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const [{ orderNumber }, { t }, session] = await Promise.all([
    params,
    searchParams,
    auth(),
  ]);
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();

  // Viewable only by: the customer who placed it, staff/admin, or anyone
  // holding the access token from the confirmation redirect (guests).
  const isOwner = !!session?.user && order.userId === session.user.id;
  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
  const hasToken = !!t && t === order.accessToken;
  if (!isOwner && !isStaff && !hasToken) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sage/15 text-sage">
          <svg aria-hidden width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-4 font-display text-4xl text-burgundy">
          Thank you — your order is confirmed
        </h1>
        <p className="mt-2 text-ink/70">
          Order <span className="font-semibold text-ink">{order.orderNumber}</span>
          {" · "}placed{" "}
          {dateFormatter.format(order.createdAt)}
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-petal border border-stone bg-white shadow-bloom">
        {/* Delivery block — the part a flower shop cares about most */}
        <div className="border-b border-stone bg-blush/10 px-6 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-sage">
            Delivery
          </h2>
          <p className="mt-1.5 text-lg font-medium">
            {deliveryDateFormatter.format(order.deliveryDate)}, {order.deliveryTimeSlot}
          </p>
          <p className="mt-1 text-ink/70">
            To {order.recipientName} · {order.recipientPhone}
          </p>
          <p className="text-ink/70">
            {order.addressLine1}
            {order.addressLine2 ? `, ${order.addressLine2}` : ""}
            {order.area ? `, ${order.area}` : ""}, {order.city}
          </p>
          {order.giftMessage && (
            <p className="mt-3 border-l-2 border-blush pl-3 italic text-ink/70">
              “{order.giftMessage}”
            </p>
          )}
        </div>

        <ul className="divide-y divide-stone px-6">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-stone/40">
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.nameSnapshot}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {item.productSlug ? (
                  <Link
                    href={`/product/${item.productSlug}`}
                    className="font-medium hover:text-burgundy"
                  >
                    {item.nameSnapshot}
                  </Link>
                ) : (
                  <span className="font-medium">{item.nameSnapshot}</span>
                )}
                <p className="text-sm text-ink/60">
                  {formatPrice(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <span className="font-medium">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-stone px-6 py-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Subtotal</dt>
            <dd>{formatPrice(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/70">Delivery</dt>
            <dd>{formatPrice(order.deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone pt-3 text-base font-semibold">
            <dt>Total — {order.paymentMethod === "cod" ? "pay on delivery" : "paid"}</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="rounded-lg bg-burgundy px-6 py-3 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
