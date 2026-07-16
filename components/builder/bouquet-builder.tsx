"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import type { BuilderComponent } from "@/lib/repositories/builder";
import type { ComponentKind } from "@/lib/generated/prisma/client";
import { formatPrice } from "@/lib/money";
import { useCart } from "@/lib/cart/store";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { BouquetPreview } from "@/components/builder/bouquet-preview";
import {
  BUILDER_STEPS,
  SINGLE_KINDS,
  hasStem,
  pickSingle,
  runningTotal,
  selectedItems,
  useBuilderStore,
} from "@/lib/builder/store";

const KIND_LABEL: Record<ComponentKind, string> = {
  STEM: "Flowers",
  GREENERY: "Greenery",
  WRAP: "Wrap",
  RIBBON: "Ribbon",
  VASE: "Vase / box",
  CARD: "Card",
};

export function BouquetBuilder({
  components,
}: {
  components: BuilderComponent[];
}) {
  const router = useRouter();
  const addCustomBouquet = useCart((s) => s.addCustomBouquet);
  const {
    step,
    selections,
    name,
    cardMessage,
    setStep,
    setQty,
    setName,
    setCardMessage,
    reset,
  } = useBuilderStore();
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const current = BUILDER_STEPS[step];
  const total = runningTotal(selections, components);
  const stemOk = hasStem(selections, components);

  const stepComponents = useMemo(
    () => components.filter((c) => current.kinds.includes(c.kind)),
    [components, current.kinds],
  );

  const save = useMutation({
    mutationFn: async () => {
      const items = selectedItems(selections, components).map((s) => ({
        componentId: s.component.id,
        quantity: s.quantity,
      }));
      const res = await fetch("/api/builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || undefined,
          cardMessage: cardMessage || undefined,
          items,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save bouquet");
      return data.bouquet as {
        id: string;
        name: string | null;
        totalPrice: number;
        shareToken: string;
        previewImageUrl: string | null;
      };
    },
    onSuccess: (bouquet) => {
      addCustomBouquet({
        customBouquetId: bouquet.id,
        name: bouquet.name || "Custom bouquet",
        unitPrice: bouquet.totalPrice,
        imageUrl: bouquet.previewImageUrl,
      });
      setShareUrl(
        `${window.location.origin}/builder/share/${bouquet.shareToken}`,
      );
      reset();
      router.push("/cart");
    },
    onError: (e: Error) => setError(e.message),
  });

  function goNext() {
    setError(null);
    if (step === 0 && !stemOk) {
      setError("Choose at least one flower stem to continue.");
      return;
    }
    if (step < BUILDER_STEPS.length - 1) setStep(step + 1);
  }

  function handleAddToCart() {
    setError(null);
    if (!stemOk) {
      setError("Add at least one flower stem before adding to cart.");
      setStep(0);
      return;
    }
    save.mutate();
  }

  function toggleSingle(component: BuilderComponent) {
    const selected = selections[component.id];
    const next = pickSingle(
      selections,
      components,
      component.kind,
      selected ? null : component.id,
    );
    // Apply by replacing selections wholesale via individual updates.
    useBuilderStore.setState({ selections: next });
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[1fr_360px]">
      <div>
        <p className="text-sm uppercase tracking-[0.25em] text-sage">
          Build your own
        </p>
        <h1 className="mt-2 font-display text-4xl text-burgundy sm:text-5xl">
          Compose a bouquet
        </h1>
        <p className="mt-3 max-w-xl text-ink/70">
          Choose stems, greenery, wrap, and a vase — watch the arrangement
          come together, then add it to your cart.
        </p>

        {/* Step tabs */}
        <ol className="mt-8 flex flex-wrap gap-2" aria-label="Builder steps">
          {BUILDER_STEPS.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  i === step
                    ? "border-burgundy bg-burgundy text-ivory"
                    : i < step
                      ? "border-sage/40 bg-white text-sage hover:border-sage"
                      : "border-stone bg-white text-ink/50 hover:border-sage"
                }`}
              >
                {i + 1}. {s.title}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8 rounded-petal border border-stone bg-white p-6 shadow-bloom">
          <h2 className="font-display text-2xl text-ink">{current.title}</h2>

          {current.id === "finish" ? (
            <div className="mt-5 space-y-4">
              <div>
                <Label htmlFor="bouquet-name">Name this bouquet (optional)</Label>
                <Input
                  id="bouquet-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="For Ammi"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="card-message">Card message (optional)</Label>
                <Textarea
                  id="card-message"
                  rows={3}
                  value={cardMessage}
                  onChange={(e) => setCardMessage(e.target.value)}
                  placeholder="A few words for the card tucked into the wrap"
                  maxLength={500}
                />
              </div>
              <div className="rounded-lg bg-ivory px-4 py-3 text-sm text-ink/70">
                <p className="font-medium text-ink">Your selection</p>
                <ul className="mt-2 space-y-1">
                  {selectedItems(selections, components).map(
                    ({ component, quantity }) => (
                      <li key={component.id} className="flex justify-between">
                        <span>
                          {KIND_LABEL[component.kind]}: {component.name}
                          {quantity > 1 ? ` × ${quantity}` : ""}
                        </span>
                        <span>
                          {formatPrice(component.unitPrice * quantity)}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
                <p className="mt-3 flex justify-between border-t border-stone pt-2 font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {stepComponents.length === 0 ? (
                <p className="text-ink/60 sm:col-span-2">
                  No options in this step yet — skip ahead or ask the florist
                  to add them in admin.
                </p>
              ) : (
                stepComponents.map((component) => {
                  const qty = selections[component.id] ?? 0;
                  const isSingle = SINGLE_KINDS.has(component.kind);
                  const selected = qty > 0;
                  return (
                    <div
                      key={component.id}
                      className={`flex gap-3 rounded-lg border p-3 transition-colors ${
                        selected
                          ? "border-burgundy bg-burgundy/5"
                          : "border-stone bg-white"
                      }`}
                    >
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-stone/40">
                        {component.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={component.imageUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{component.name}</p>
                        <p className="text-sm text-ink/60">
                          {formatPrice(component.unitPrice)}
                          {component.stock <= 5
                            ? ` · ${component.stock} left`
                            : ""}
                        </p>
                        {isSingle ? (
                          <button
                            type="button"
                            onClick={() => toggleSingle(component)}
                            className="mt-2 text-sm font-medium text-sage hover:text-burgundy"
                          >
                            {selected ? "Remove" : "Choose"}
                          </button>
                        ) : (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              className="rounded border border-stone px-2 py-0.5 hover:text-burgundy disabled:opacity-40"
                              disabled={qty <= 0}
                              onClick={() => setQty(component.id, qty - 1)}
                              aria-label={`Remove one ${component.name}`}
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm">
                              {qty}
                            </span>
                            <button
                              type="button"
                              className="rounded border border-stone px-2 py-0.5 hover:text-burgundy disabled:opacity-40"
                              disabled={qty >= Math.min(component.maxQty, component.stock)}
                              onClick={() => setQty(component.id, qty + 1)}
                              aria-label={`Add one ${component.name}`}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-burgundy">
              {error}
            </p>
          )}
          {shareUrl && (
            <p className="mt-4 text-sm text-sage">
              Share link saved — open it anytime to view this design.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="text-sm font-medium text-ink/60 hover:text-burgundy disabled:opacity-40"
            >
              Back
            </button>
            <div className="flex gap-2">
              {step < BUILDER_STEPS.length - 1 ? (
                <>
                  {current.kinds.every((k) =>
                    ["GREENERY", "WRAP", "RIBBON", "VASE"].includes(k),
                  ) && (
                    <Button variant="secondary" onClick={goNext}>
                      Skip
                    </Button>
                  )}
                  <Button onClick={goNext}>Continue</Button>
                </>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  disabled={save.isPending || !stemOk}
                  size="lg"
                >
                  {save.isPending
                    ? "Adding…"
                    : `Add to cart · ${formatPrice(total)}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <BouquetPreview selections={selections} components={components} />
      </aside>
    </div>
  );
}
