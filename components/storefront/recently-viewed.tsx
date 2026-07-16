"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";
import { formatPrice } from "@/lib/money";
import { useHydrated } from "@/lib/use-hydrated";

export function TrackRecentlyViewed({ product }: { product: RecentProduct }) {
  const track = useRecentlyViewed((s) => s.track);
  useEffect(() => {
    track(product);
  }, [product, track]);
  return null;
}

export function RecentlyViewedRail({ excludeId }: { excludeId?: string }) {
  const items = useRecentlyViewed((s) => s.items);
  const hydrated = useHydrated();
  if (!hydrated) return null;
  const visible = items.filter((i) => i.id !== excludeId).slice(0, 4);
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <h2 className="font-display text-3xl text-burgundy">Recently viewed</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {visible.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            className="group overflow-hidden rounded-petal bg-white shadow-bloom transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-bloom-lg motion-reduce:transition-none"
          >
            <div className="relative aspect-[4/5] bg-stone/40">
              {p.imageUrl && (
                <Image
                  src={p.imageUrl}
                  alt={p.name}
                  fill
                  sizes="25vw"
                  className="object-cover"
                  unoptimized={!p.imageUrl.includes("images.unsplash.com")}
                />
              )}
            </div>
            <div className="px-4 py-3">
              <p className="truncate font-medium group-hover:text-burgundy">
                {p.name}
              </p>
              <p className="mt-1 text-sm">{formatPrice(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
