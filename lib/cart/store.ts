"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Client-side cart. Prices held here are display-only; the server re-prices
// every line from the database when the order is placed.
export type CartLine = {
  /** productId or productId:variantId */
  key: string;
  productId: string;
  variantId: string | null;
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
  addLine: (line: Omit<CartLine, "key">) => void;
  removeLine: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isDrawerOpen: false,
      addLine: (line) =>
        set((state) => {
          const key = line.variantId
            ? `${line.productId}:${line.variantId}`
            : line.productId;
          const existing = state.lines.find((l) => l.key === key);
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
            : [...state.lines, { ...line, key }];
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
                    ? { ...l, quantity: Math.min(quantity, l.maxQuantity) }
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
    },
  ),
);

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
