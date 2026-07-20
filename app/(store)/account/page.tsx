import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listOrdersForUser } from "@/lib/repositories/orders";
import { listWishlist } from "@/lib/repositories/wishlist";
import { getLoyaltyPoints } from "@/lib/repositories/retention";
import { getAccountProfile } from "@/lib/repositories/account";
import { getLoyaltySettings } from "@/lib/repositories/settings";
import { formatPrice } from "@/lib/money";
import { canOptimizeImage } from "@/lib/images";
import { isSaleActive } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/storefront/price";
import { WishlistRemoveButton } from "@/components/storefront/wishlist-remove-button";
import { ProfileSettings } from "@/components/account/profile-settings";
import { AccountStaffBanner } from "@/components/account/account-staff-banner";
import { TabSessionGate } from "@/components/auth/tab-session-gate";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { EmptyState } from "@/components/ui/empty-state";
import { orderStatusBadgeVariant } from "@/components/ui/badge";

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

  const [orders, wishlist, loyaltyPoints, profile, loyaltySettings] =
    await Promise.all([
      listOrdersForUser(session.user.id),
      listWishlist(session.user.id),
      getLoyaltyPoints(session.user.id),
      getAccountProfile(session.user.id),
      getLoyaltySettings(),
    ]);

  const isStaff =
    session.user.role === "ADMIN" || session.user.role === "STAFF";

  if (!profile) redirect("/login?callbackUrl=/account");

  return (
    <TabSessionGate callbackPath="/account">
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-burgundy">My account</h1>
          <p className="mt-1 text-ink/70">
            Signed in as {session.user.email}
          </p>
        </div>
        <SignOutButton className="rounded-lg border border-stone bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-sage hover:text-burgundy" />
      </div>

      {isStaff && <AccountStaffBanner />}

      <ProfileSettings
        initial={{
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          image: profile.image,
        }}
      />

      {loyaltySettings.enabled && (
        <div className="mt-8 rounded-petal border border-stone bg-white px-5 py-4">
          <p className="text-sm uppercase tracking-wider text-sage">
            Loyalty points
          </p>
          <p className="mt-1 font-display text-3xl text-burgundy">
            {loyaltyPoints}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            Earn 1 point per Rs {loyaltySettings.rupeesPerPoint} spent on
            completed orders.
          </p>
        </div>
      )}

      <h2 className="mt-10 font-display text-2xl text-burgundy">Wishlist</h2>
      {wishlist.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="Your wishlist is empty"
          description="Save bouquets you love from any product page — they’ll show up here."
          actionHref="/category/bouquets"
          actionLabel="Browse bouquets"
        />
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {wishlist.map((item) => {
            const saleActive = isSaleActive(item);
            return (
              <li key={item.id} className="surface-panel flex gap-3 p-3">
                <Link
                  href={`/product/${item.slug}`}
                  className="relative block h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-stone/40"
                >
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.imageAlt ?? item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized={!canOptimizeImage(item.imageUrl)}
                    />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${item.slug}`}
                    className="font-medium hover:text-burgundy"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-1">
                    <Price
                      price={item.price}
                      salePrice={item.salePrice}
                      isSaleActive={saleActive}
                      className="text-sm"
                    />
                  </div>
                  <WishlistRemoveButton productId={item.productId} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="mt-10 font-display text-2xl text-burgundy">Order history</h2>
      {orders.length === 0 ? (
        <EmptyState
          className="mt-4"
          title="No orders yet"
          description="When you place an order, it will show up here with delivery details."
          actionHref="/category/bouquets"
          actionLabel="Shop bouquets"
        />
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/order/${order.orderNumber}`}
                className="surface-panel block p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-bloom-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{order.orderNumber}</span>
                  <Badge variant={orderStatusBadgeVariant(order.status)}>
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
    </TabSessionGate>
  );
}
