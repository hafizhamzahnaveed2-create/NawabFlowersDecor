"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Client-side cart. Prices held here are display-only; the server re-prices
// every line from the database when the order is placed.
export type CartLine = {
  key: string;
  kind: "product" | "custom";
  productId: string | null;
  variantId: string | null;
  customBouquetId: string | null;
  slug: string;
  name: string;
  variantName: string | null;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
};

type CartState = {
  lines: CartLine[];
  isDrawerOpen: boolean;
  addProduct: (
    line: Omit<CartLine, "key" | "kind" | "customBouquetId"> & {
      productId: string;
    },
  ) => void;
  addCustomBouquet: (line: {
    customBouquetId: string;
    name: string;
    unitPrice: number;
    imageUrl: string | null;
  }) => void;
  removeLine: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

function normalizeLine(raw: CartLine & { productId?: string | null }): CartLine {
  // Migrate Phase-2 persisted lines that lack `kind`.
  if (!raw.kind) {
    return {
      ...raw,
      kind: "product",
      productId: raw.productId ?? "",
      customBouquetId: null,
    };
  }
  return raw;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isDrawerOpen: false,
      addProduct: (line) =>
        set((state) => {
          const key = line.variantId
            ? `${line.productId}:${line.variantId}`
            : line.productId;
          const existing = state.lines.find((l) => l.key === key);
          const next: CartLine = {
            ...line,
            key,
            kind: "product",
            customBouquetId: null,
          };
          const lines = existing
            ? state.lines.map((l) =>
                l.key === key
                  ? {
                      ...l,
                      quantity: Math.min(
                        l.quantity + line.quantity,
                        l.maxQuantity,
                      ),
                    }
                  : l,
              )
            : [...state.lines, next];
          return { lines, isDrawerOpen: true };
        }),
      addCustomBouquet: (line) =>
        set((state) => {
          const key = `custom:${line.customBouquetId}`;
          // Each custom design is its own line (never merge).
          const next: CartLine = {
            key,
            kind: "custom",
            productId: null,
            variantId: null,
            customBouquetId: line.customBouquetId,
            slug: "custom-bouquet",
            name: line.name || "Custom bouquet",
            variantName: "Build-your-own",
            unitPrice: line.unitPrice,
            imageUrl: line.imageUrl,
            quantity: 1,
            maxQuantity: 1,
          };
          const lines = state.lines.some((l) => l.key === key)
            ? state.lines
            : [...state.lines, next];
          return { lines, isDrawerOpen: true };
        }),
      removeLine: (key) =>
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) =>
                  l.key === key
                    ? {
                        ...l,
                        quantity: Math.min(quantity, l.maxQuantity),
                      }
                    : l,
                ),
        })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),
    }),
    {
      name: "nawab-cart",
      partialize: (state) => ({ lines: state.lines }),
      merge: (persisted, current) => {
        const p = persisted as { lines?: CartLine[] } | undefined;
        return {
          ...current,
          ...(p ?? {}),
          lines: (p?.lines ?? []).map(normalizeLine),
        };
      },
    },
  ),
);

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
