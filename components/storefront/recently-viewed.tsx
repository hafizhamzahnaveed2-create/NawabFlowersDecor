"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRecentlyViewed, type RecentProduct } from "@/lib/recently-viewed";
import { formatPrice } from "@/lib/money";
import { canOptimizeImage } from "@/lib/images";
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
            className="card-3d group block overflow-hidden rounded-petal bg-white shadow-bloom"
          >
            <div className="card-3d-inner">
              <div className="relative aspect-[4/5] bg-stone/40">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    fill
                    sizes="25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
                    unoptimized={!canOptimizeImage(p.imageUrl)}
                  />
                )}
              </div>
              <div className="px-4 py-3">
                <p className="truncate font-medium group-hover:text-burgundy">
                  {p.name}
                </p>
                <p className="mt-1 text-sm">{formatPrice(p.price)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
