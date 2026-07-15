"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useCart, cartSubtotal } from "@/lib/cart/store";
import { formatPrice } from "@/lib/money";
import {
  DELIVERY_FEE,
  DELIVERY_TIME_SLOTS,
  earliestDeliveryDate,
  latestDeliveryDate,
  toDateInputValue,
} from "@/lib/delivery";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { useHydrated } from "@/lib/use-hydrated";

type FieldErrors = Partial<Record<string, string>>;

export function CheckoutForm({
  isSignedIn,
  userEmail,
}: {
  isSignedIn: boolean;
  userEmail: string | null;
}) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const hydrated = useHydrated();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const placeOrder = useMutation({
    mutationFn: async (input: CheckoutInput) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the order");
      return data.order as { orderNumber: string; accessToken: string };
    },
    onSuccess: (order) => {
      clear();
      router.push(`/order/${order.orderNumber}?t=${order.accessToken}`);
    },
    onError: (error: Error) => setServerError(error.message),
  });

  if (!hydrated) {
    return <div className="mt-8 h-60 animate-pulse rounded-petal bg-stone/50" />;
  }

  if (lines.length === 0 && !placeOrder.isPending && !placeOrder.isSuccess) {
    return (
      <div className="mt-8 rounded-petal border border-stone bg-white p-12 text-center">
        <p className="font-display text-2xl text-burgundy">
          Your cart is empty
        </p>
        <Link
          href="/category/bouquets"
          className="mt-6 inline-block rounded-lg bg-burgundy px-6 py-3 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
        >
          Shop bouquets
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setServerError(null);

    const fd = new FormData(event.currentTarget);
    const raw = {
      items: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        quantity: l.quantity,
      })),
      deliveryDate: String(fd.get("deliveryDate") ?? ""),
      deliveryTimeSlot: String(fd.get("deliveryTimeSlot") ?? ""),
      giftMessage: String(fd.get("giftMessage") ?? ""),
      recipientName: String(fd.get("recipientName") ?? ""),
      recipientPhone: String(fd.get("recipientPhone") ?? ""),
      addressLine1: String(fd.get("addressLine1") ?? ""),
      addressLine2: String(fd.get("addressLine2") ?? ""),
      city: String(fd.get("city") ?? ""),
      area: String(fd.get("area") ?? ""),
      postalCode: String(fd.get("postalCode") ?? ""),
      guestEmail: isSignedIn ? "" : String(fd.get("guestEmail") ?? ""),
      paymentMethod: "cod" as const,
    };

    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      const tree = z.flattenError(parsed.error).fieldErrors;
      const flat: FieldErrors = {};
      for (const [key, msgs] of Object.entries(tree)) {
        if (msgs?.[0]) flat[key] = msgs[0];
      }
      setErrors(flat);
      return;
    }
    if (!isSignedIn && !parsed.data.guestEmail) {
      setErrors({ guestEmail: "Email is required" });
      return;
    }
    placeOrder.mutate(parsed.data);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]"
    >
      <div className="space-y-8">
        {/* Contact */}
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Contact</h2>
          {isSignedIn ? (
            <p className="mt-3 text-sm text-ink/70">
              Ordering as <span className="font-medium">{userEmail}</span>
            </p>
          ) : (
            <div className="mt-4">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                name="guestEmail"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
              <FieldError message={errors.guestEmail} />
              <p className="mt-2 text-sm text-ink/60">
                Already have an account?{" "}
                <Link
                  href="/login?callbackUrl=/checkout"
                  className="font-medium text-sage underline-offset-4 hover:text-burgundy hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* Delivery schedule */}
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">
            Delivery date & time
          </h2>
          <p className="mt-1 text-sm text-ink/60">
            Flowers are prepared fresh for your chosen slot.
          </p>
          <div className="mt-4">
            <Label htmlFor="deliveryDate">Delivery date</Label>
            <Input
              id="deliveryDate"
              name="deliveryDate"
              type="date"
              min={toDateInputValue(earliestDeliveryDate())}
              max={toDateInputValue(latestDeliveryDate())}
              defaultValue={toDateInputValue(earliestDeliveryDate())}
            />
            <FieldError message={errors.deliveryDate} />
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium">Time slot</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {DELIVERY_TIME_SLOTS.map((slot, i) => (
                <label
                  key={slot}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone px-3.5 py-2.5 text-sm transition-colors has-checked:border-burgundy has-checked:bg-burgundy/5"
                >
                  <input
                    type="radio"
                    name="deliveryTimeSlot"
                    value={slot}
                    defaultChecked={i === 0}
                    className="accent-burgundy"
                  />
                  {slot}
                </label>
              ))}
            </div>
            <FieldError message={errors.deliveryTimeSlot} />
          </fieldset>
        </section>

        {/* Recipient & address */}
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">
            Deliver to
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="recipientName">Recipient name</Label>
              <Input id="recipientName" name="recipientName" autoComplete="name" />
              <FieldError message={errors.recipientName} />
            </div>
            <div>
              <Label htmlFor="recipientPhone">Recipient phone</Label>
              <Input
                id="recipientPhone"
                name="recipientPhone"
                type="tel"
                autoComplete="tel"
                placeholder="03xx-xxxxxxx"
              />
              <FieldError message={errors.recipientPhone} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addressLine1">Street address</Label>
              <Input
                id="addressLine1"
                name="addressLine1"
                autoComplete="address-line1"
              />
              <FieldError message={errors.addressLine1} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="addressLine2">
                Apartment, floor, landmark (optional)
              </Label>
              <Input
                id="addressLine2"
                name="addressLine2"
                autoComplete="address-line2"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" autoComplete="address-level2" />
              <FieldError message={errors.city} />
            </div>
            <div>
              <Label htmlFor="area">Area / neighbourhood (optional)</Label>
              <Input id="area" name="area" />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal code (optional)</Label>
              <Input id="postalCode" name="postalCode" autoComplete="postal-code" />
            </div>
          </div>
        </section>

        {/* Gift message */}
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Gift message</h2>
          <p className="mt-1 text-sm text-ink/60">
            Handwritten on a card and tucked into the arrangement. Optional.
          </p>
          <Textarea
            name="giftMessage"
            rows={3}
            maxLength={500}
            placeholder="“Happy birthday, Ammi — with all my love.”"
            className="mt-3"
          />
        </section>

        {/* Payment */}
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">Payment</h2>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-lg border border-burgundy bg-burgundy/5 px-4 py-3">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              defaultChecked
              className="accent-burgundy"
            />
            <span>
              <span className="font-medium">Cash on delivery</span>
              <span className="block text-sm text-ink/60">
                Pay the rider when your flowers arrive.
              </span>
            </span>
          </label>
          <p className="mt-3 text-sm text-ink/50">
            Card payments are coming soon.
          </p>
        </section>
      </div>

      {/* Order summary */}
      <aside className="h-fit rounded-petal border border-stone bg-white p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl text-burgundy">Your order</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((line) => (
            <li key={line.key} className="flex justify-between gap-3">
              <span className="text-ink/80">
                {line.name}
                {line.variantName ? ` — ${line.variantName}` : ""} × {line.quantity}
              </span>
              <span className="shrink-0 font-medium">
                {formatPrice(line.unitPrice * line.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-stone pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink/70">Delivery</dt>
            <dd>{formatPrice(DELIVERY_FEE)}</dd>
          </div>
          <div className="flex justify-between border-t border-stone pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(subtotal + DELIVERY_FEE)}</dd>
          </div>
        </dl>

        {serverError && (
          <p role="alert" className="mt-4 text-sm text-burgundy">
            {serverError}
          </p>
        )}

        <Button
          type="submit"
          disabled={placeOrder.isPending}
          className="mt-5 w-full"
          size="lg"
        >
          {placeOrder.isPending ? "Placing order…" : "Place order"}
        </Button>
      </aside>
    </form>
  );
}
