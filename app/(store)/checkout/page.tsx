import { auth } from "@/lib/auth";
import { CheckoutForm } from "./checkout-form";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-4xl text-burgundy">Checkout</h1>
      <CheckoutForm
        isSignedIn={!!session?.user}
        userEmail={session?.user?.email ?? null}
      />
    </div>
  );
}
