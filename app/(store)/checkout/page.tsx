import { auth } from "@/lib/auth";
import { CheckoutForm } from "./checkout-form";
import { TrackCheckoutStart } from "@/components/storefront/track-checkout-start";
import { listPaymentAccounts } from "@/lib/repositories/settings";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const [session, paymentAccounts] = await Promise.all([
    auth(),
    listPaymentAccounts(true),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <TrackCheckoutStart />
      <h1 className="font-display text-4xl text-burgundy">Checkout</h1>
      <CheckoutForm
        isSignedIn={!!session?.user}
        userEmail={session?.user?.email ?? null}
        paymentAccounts={paymentAccounts.map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          accountTitle: a.accountTitle,
          accountNumber: a.accountNumber,
          iconKey: a.iconKey,
          instructions: a.instructions,
        }))}
      />
    </div>
  );
}
