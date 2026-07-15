"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

// The storefront's one ambient motion: the hero photo drifts a few pixels as
// the page scrolls, like a print catalogue page catching light. Disabled
// entirely under prefers-reduced-motion.
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 48]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-blush/25 via-ivory to-ivory"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-sage">
            Fresh · Hand-tied · Delivered on time
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[1.05] text-burgundy sm:text-6xl">
            Flowers that say it before you do
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/75">
            Hand-tied bouquets for every occasion, individual stems for your
            own arrangements, and gifts to go with them.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/category/bouquets"
              className="rounded-lg bg-burgundy px-6 py-3 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
            >
              Shop bouquets
            </Link>
            <Link
              href="/category/raw-materials"
              className="rounded-lg border border-stone bg-white px-6 py-3 font-medium text-ink transition-colors hover:border-sage hover:text-burgundy"
            >
              Shop stems
            </Link>
          </div>
        </div>
        <motion.div
          style={reducedMotion ? undefined : { y }}
          className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-petal shadow-bloom-lg"
        >
          <Image
            src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=1200&q=80"
            alt="A hand-tied bouquet of blush and cream roses"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
