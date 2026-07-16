"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RecentProduct = {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  price: number;
};

type RecentState = {
  items: RecentProduct[];
  track: (product: RecentProduct) => void;
};

const MAX = 8;

export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set) => ({
      items: [],
      track: (product) =>
        set((state) => {
          const filtered = state.items.filter((i) => i.id !== product.id);
          return { items: [product, ...filtered].slice(0, MAX) };
        }),
    }),
    { name: "nawab-recently-viewed" },
  ),
);
