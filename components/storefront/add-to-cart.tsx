"use client";

import { useState } from "react";
import type { ProductDetail } from "@/lib/repositories/products";
import { effectivePrice } from "@/lib/pricing";
import { formatPrice } from "@/lib/money";
import { useCart } from "@/lib/cart/store";
import { Button } from "@/components/ui/button";

export function AddToCart({ product }: { product: ProductDetail }) {
  const addProduct = useCart((s) => s.addProduct);
  const hasVariants = product.variants.length > 0;
  const [variantId, setVariantId] = useState<string | null>(
    hasVariants ? product.variants[0].id : null,
  );
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = variant ? variant.price : effectivePrice(product);
  const stock = variant ? variant.stock : product.stock;
  const soldOut = stock <= 0;

  function handleAdd() {
    addProduct({
      productId: product.id,
      variantId: variant?.id ?? null,
      slug: product.slug,
      name: product.name,
      variantName: variant?.name ?? null,
      unitPrice,
      imageUrl: product.imageUrl,
      quantity,
      maxQuantity: stock,
    });
  }

  return (
    <div className="space-y-5">
      {hasVariants && (
        <fieldset>
          <legend className="text-sm font-medium">Size</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setQuantity(1);
                  }}
                  disabled={v.stock <= 0}
                  aria-pressed={selected}
                  className={`rounded-lg border px-3.5 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    selected
                      ? "border-burgundy bg-burgundy text-ivory"
                      : "border-stone bg-white hover:border-sage"
                  }`}
                >
                  {v.name} · {formatPrice(v.price)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-stone bg-white">
          <button
            type="button"
            className="px-3.5 py-2.5 hover:text-burgundy disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-8 text-center" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="px-3.5 py-2.5 hover:text-burgundy disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            disabled={quantity >= stock}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        <Button onClick={handleAdd} disabled={soldOut} className="flex-1">
          {soldOut ? "Sold out" : `Add to cart · ${formatPrice(unitPrice * quantity)}`}
        </Button>
      </div>

      <p className="text-sm text-ink/60">
        {soldOut
          ? "Currently unavailable."
          : stock <= 5
            ? `Only ${stock} left in stock.`
            : "In stock — order by 6 pm for next-day delivery."}
      </p>
    </div>
  );
}
