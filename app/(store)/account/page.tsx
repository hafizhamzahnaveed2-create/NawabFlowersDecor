import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/repositories/orders";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "My account" };

// Delivery dates are date-only values stored at UTC midnight; format in UTC.
const dateFormatter = new Intl.DateTimeFormat("en-PK", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  const orders = await listOrdersForUser(session.user.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-burgundy">My account</h1>
          <p className="mt-1 text-ink/70">
            Signed in as {session.user.email}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-lg border border-stone bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-sage hover:text-burgundy"
          >
            Sign out
          </button>
        </form>
      </div>

      <h2 className="mt-10 font-display text-2xl text-ink">Order history</h2>
      {orders.length === 0 ? (
        <div className="mt-4 rounded-petal border border-stone bg-white p-12 text-center">
          <p className="font-display text-2xl text-burgundy">No orders yet</p>
          <p className="mt-2 text-ink/60">
            When you place an order, it will show up here.
          </p>
          <Link
            href="/category/bouquets"
            className="mt-6 inline-block rounded-lg bg-burgundy px-6 py-3 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
          >
            Shop bouquets
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/order/${order.orderNumber}`}
                className="block rounded-petal border border-stone bg-white p-5 shadow-bloom transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-bloom-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{order.orderNumber}</span>
                  <Badge
                    variant={order.status === "DELIVERED" ? "new" : "muted"}
                  >
                    {statusLabels[order.status] ?? order.status}
                  </Badge>
                </div>
                <p className="mt-2 truncate text-sm text-ink/70">
                  {order.items
                    .map((i) => `${i.nameSnapshot} × ${i.quantity}`)
                    .join(", ")}
                </p>
                <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-ink/60">
                    Delivery {dateFormatter.format(order.deliveryDate)},{" "}
                    {order.deliveryTimeSlot}
                  </span>
                  <span className="font-medium">{formatPrice(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
