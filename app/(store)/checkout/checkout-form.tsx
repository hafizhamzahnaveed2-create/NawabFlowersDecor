"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useCart, cartSubtotal } from "@/lib/cart/store";
import { formatPrice } from "@/lib/money";
import {
  DEFAULT_DELIVERY_FEE,
  DELIVERY_TIME_SLOTS,
  earliestDeliveryDate,
  latestDeliveryDate,
  toDateInputValue,
} from "@/lib/delivery";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { useHydrated } from "@/lib/use-hydrated";
import { AbandonedCartSync } from "@/components/storefront/abandoned-cart-sync";
import { PaymentMethodIcon } from "@/components/storefront/brand-icons";
import type { PaymentAccountPublic } from "@/components/storefront/payment-methods-footer";

type FieldErrors = Partial<Record<string, string>>;

type AppliedCoupon = {
  code: string;
  discount: number;
};

type CheckoutQuote = {
  deliveryFee: number;
  taxAmount: number;
  total: number;
  deliveryZoneName: string | null;
  taxRatePercent: number;
};

export function CheckoutForm({
  isSignedIn,
  userEmail,
  paymentAccounts,
  minLeadDays = 0,
  maxLeadDays = 30,
}: {
  isSignedIn: boolean;
  userEmail: string | null;
  paymentAccounts: PaymentAccountPublic[];
  minLeadDays?: number;
  maxLeadDays?: number;
}) {
  const router = useRouter();
  const { lines, clear } = useCart();
  const hydrated = useHydrated();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [transactionId, setTransactionId] = useState("");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const syncEmail = isSignedIn ? userEmail : guestEmail;
  const selectedAccount = paymentAccounts.find((a) => a.slug === paymentMethod);

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

  const subtotal = cartSubtotal(lines);
  const discount = appliedCoupon?.discount ?? 0;

  useEffect(() => {
    const trimmedCity = city.trim();
    if (!trimmedCity) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const params = new URLSearchParams({
          city: trimmedCity,
          subtotal: String(subtotal),
          discount: String(discount),
        });
        const trimmedArea = area.trim();
        if (trimmedArea) params.set("area", trimmedArea);

        const res = await fetch(`/api/checkout/quote?${params}`);
        if (!res.ok) {
          setQuote(null);
          return;
        }
        const data = (await res.json()) as CheckoutQuote;
        setQuote(data);
      } catch {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [city, area, subtotal, discount]);

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

  const fallbackTotal = Math.max(0, subtotal - discount) + DEFAULT_DELIVERY_FEE;
  const displayTotal = quote?.total ?? fallbackTotal;
  const displayDeliveryFee = quote?.deliveryFee ?? DEFAULT_DELIVERY_FEE;

  async function applyCoupon() {
    setCouponError(null);
    setCouponBusy(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponInput.trim().toUpperCase(),
          subtotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Invalid code");
      setAppliedCoupon({
        code: data.coupon.code as string,
        discount: data.discount as number,
      });
      setCouponInput(data.coupon.code as string);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setCouponBusy(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setServerError(null);

    const fd = new FormData(event.currentTarget);
    const raw = {
      items: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        customBouquetId: l.customBouquetId,
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
      paymentMethod,
      paymentAccountId: selectedAccount?.id ?? "",
      transactionId: paymentMethod === "cod" ? "" : transactionId,
      receiptImageUrl: paymentMethod === "cod" ? "" : (receiptUrl ?? ""),
      couponCode: appliedCoupon?.code ?? "",
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
    <>
      <AbandonedCartSync email={syncEmail} />
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
                <Label htmlFor="guestEmail" required>
                  Email
                </Label>
                <Input
                  id="guestEmail"
                  name="guestEmail"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
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
              <Label htmlFor="deliveryDate" required>
                Delivery date
              </Label>
              <Input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                min={toDateInputValue(earliestDeliveryDate(undefined, minLeadDays))}
                max={toDateInputValue(latestDeliveryDate(undefined, maxLeadDays))}
                defaultValue={toDateInputValue(
                  earliestDeliveryDate(undefined, minLeadDays),
                )}
              />
              <FieldError message={errors.deliveryDate} />
            </div>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium">
                Time slot
                <span
                  className="ml-0.5 font-semibold text-burgundy"
                  aria-hidden="true"
                >
                  *
                </span>
              </legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
            <h2 className="font-display text-xl text-burgundy">Deliver to</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="recipientName" required>
                  Recipient name
                </Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  autoComplete="name"
                />
                <FieldError message={errors.recipientName} />
              </div>
              <div>
                <Label htmlFor="recipientPhone" required>
                  Recipient phone
                </Label>
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
                <Label htmlFor="addressLine1" required>
                  Street address
                </Label>
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
                <Label htmlFor="city" required>
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
                <FieldError message={errors.city} />
              </div>
              <div>
                <Label htmlFor="area">Area / neighbourhood (optional)</Label>
                <Input
                  id="area"
                  name="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">Postal code (optional)</Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  autoComplete="postal-code"
                />
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
            <div className="mt-4 space-y-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 ${
                  paymentMethod === "cod"
                    ? "border-burgundy bg-burgundy/5"
                    : "border-stone"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => {
                    setPaymentMethod("cod");
                    setTransactionId("");
                    setReceiptUrl(null);
                  }}
                  className="accent-burgundy"
                />
                <span>
                  <span className="font-medium">Cash on delivery</span>
                  <span className="block text-sm text-ink/60">
                    Pay the rider when your flowers arrive.
                  </span>
                </span>
              </label>

              {paymentAccounts.map((account) => (
                <label
                  key={account.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${
                    paymentMethod === account.slug
                      ? "border-burgundy bg-burgundy/5"
                      : "border-stone"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={account.slug}
                    checked={paymentMethod === account.slug}
                    onChange={() => setPaymentMethod(account.slug)}
                    className="mt-1 accent-burgundy"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-medium">
                      <PaymentMethodIcon
                        iconKey={account.iconKey}
                        variant="mark"
                        className="size-7 shrink-0"
                      />
                      {account.name}
                    </span>
                    <span className="mt-1 block text-sm text-ink/60">
                      Manual transfer — verified by our team before we prepare
                      your order.
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {selectedAccount && (
              <div className="mt-5 space-y-4 rounded-lg border border-stone bg-ivory/80 p-4">
                <p className="text-sm font-medium text-burgundy">
                  Transfer to this account, then upload your receipt
                </p>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-ink/50">Account title</dt>
                    <dd className="font-medium">{selectedAccount.accountTitle}</dd>
                  </div>
                  <div>
                    <dt className="text-ink/50">Account / IBAN</dt>
                    <dd className="font-mono">{selectedAccount.accountNumber}</dd>
                  </div>
                  {selectedAccount.instructions && (
                    <div>
                      <dt className="text-ink/50">Notes</dt>
                      <dd className="whitespace-pre-line text-ink/75">
                        {selectedAccount.instructions}
                      </dd>
                    </div>
                  )}
                </dl>
                <div>
                  <Label htmlFor="transactionId" required>
                    Transaction ID (TID)
                  </Label>
                  <Input
                    id="transactionId"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 1234567890"
                    required
                  />
                  <FieldError message={errors.transactionId} />
                </div>
                <div>
                  <Label htmlFor="receipt" required>
                    Payment receipt screenshot
                  </Label>
                  <label
                    htmlFor="receipt"
                    className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                      receiptUrl
                        ? "border-sage bg-sage/5"
                        : "border-burgundy/40 bg-white hover:border-burgundy hover:bg-blush/20"
                    }`}
                  >
                    <span className="text-sm font-bold text-burgundy">
                      {uploadBusy
                        ? "Uploading…"
                        : receiptUrl
                          ? "Receipt attached — tap to replace"
                          : "Choose file / Upload receipt"}
                    </span>
                    <span className="mt-1 text-xs text-ink/55">
                      JPEG, PNG, or WebP · under 5 MB
                    </span>
                    <input
                      id="receipt"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={uploadBusy}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadBusy(true);
                        setUploadError(null);
                        try {
                          const fd = new FormData();
                          fd.set("file", file);
                          fd.set("folder", "receipts");
                          const res = await fetch("/api/uploads", {
                            method: "POST",
                            body: fd,
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            throw new Error(data.error ?? "Upload failed");
                          }
                          setReceiptUrl(data.url as string);
                        } catch (err) {
                          setReceiptUrl(null);
                          setUploadError(
                            err instanceof Error
                              ? err.message
                              : "Upload failed",
                          );
                        } finally {
                          setUploadBusy(false);
                        }
                      }}
                    />
                  </label>
                  <FieldError
                    message={uploadError ?? errors.receiptImageUrl}
                  />
                </div>
              </div>
            )}
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
                  {line.variantName ? ` — ${line.variantName}` : ""} ×{" "}
                  {line.quantity}
                </span>
                <span className="shrink-0 font-medium">
                  {formatPrice(line.unitPrice * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-stone pt-4">
            <Label htmlFor="couponCode">Promo code</Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="couponCode"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  if (appliedCoupon) setAppliedCoupon(null);
                }}
                placeholder="WELCOME10"
                className="mt-0"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponInput("");
                    setCouponError(null);
                  }}
                >
                  Remove
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={couponBusy || !couponInput.trim()}
                  onClick={applyCoupon}
                >
                  {couponBusy ? "…" : "Apply"}
                </Button>
              )}
            </div>
            <FieldError message={couponError ?? undefined} />
            {appliedCoupon && (
              <p className="mt-2 text-sm text-sage">
                {appliedCoupon.code} applied (−
                {formatPrice(appliedCoupon.discount)})
              </p>
            )}
          </div>

          <dl className="mt-5 space-y-2 border-t border-stone pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink/70">Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sage">
                <dt>Discount</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink/70">
                Delivery
                {quote?.deliveryZoneName ? (
                  <span className="block text-xs text-ink/50">
                    {quote.deliveryZoneName}
                  </span>
                ) : null}
              </dt>
              <dd>
                {quoteLoading && city.trim() ? (
                  <span className="text-ink/50">…</span>
                ) : (
                  formatPrice(displayDeliveryFee)
                )}
              </dd>
            </div>
            {quote && quote.taxAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink/70">
                  Tax
                  {quote.taxRatePercent > 0 ? (
                    <span className="text-ink/50"> ({quote.taxRatePercent}%)</span>
                  ) : null}
                </dt>
                <dd>{formatPrice(quote.taxAmount)}</dd>
              </div>
            )}
            {!city.trim() && (
              <p className="text-xs text-ink/50">
                Enter city to calculate delivery &amp; tax
              </p>
            )}
            <div className="flex justify-between border-t border-stone pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>
                {quoteLoading && city.trim() ? (
                  <span className="text-ink/50">…</span>
                ) : (
                  formatPrice(displayTotal)
                )}
              </dd>
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
    </>
  );
}
