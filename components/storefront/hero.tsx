"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

export type HeroSlide = {
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl?: string | null;
};

const DEFAULTS: HeroSlide = {
  title: "Flowers that say it before you do",
  body: "Hand-tied bouquets for every occasion, individual stems for your own arrangements, and gifts to go with them.",
  imageUrl:
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=1200&q=80",
};

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const activeSlides =
    slides.length > 0
      ? slides.map((s) => ({
          title: s.title || DEFAULTS.title,
          body: s.body || DEFAULTS.body,
          imageUrl: s.imageUrl || DEFAULTS.imageUrl,
          linkUrl: s.linkUrl,
        }))
      : [DEFAULTS];

  const [index, setIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 48]);

  useEffect(() => {
    if (activeSlides.length < 2 || reducedMotion) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % activeSlides.length),
      7000,
    );
    return () => clearInterval(id);
  }, [activeSlides.length, reducedMotion]);

  const slide = activeSlides[index] ?? activeSlides[0];

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
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              <h1 className="mt-4 font-display text-5xl leading-[1.05] text-burgundy sm:text-6xl">
                {slide.title}
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-ink/75">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={slide.linkUrl || "/builder"}
              className="rounded-lg bg-burgundy px-6 py-3 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
            >
              Build your own
            </Link>
            <Link
              href="/category/bouquets"
              className="rounded-lg border border-stone bg-white px-6 py-3 font-medium text-ink transition-colors hover:border-sage hover:text-burgundy"
            >
              Shop bouquets
            </Link>
          </div>
          {activeSlides.length > 1 && (
            <div className="mt-6 flex gap-2" role="tablist" aria-label="Hero slides">
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-6 rounded-full transition-colors ${
                    i === index ? "bg-burgundy" : "bg-stone"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <motion.div
          style={reducedMotion ? undefined : { y }}
          className="relative aspect-[4/5] max-h-[520px] overflow-hidden rounded-petal shadow-bloom-lg"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.imageUrl}
              className="absolute inset-0"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Image
                src={slide.imageUrl!}
                alt="A hand-tied bouquet"
                fill
                priority
                unoptimized={
                  !!slide.imageUrl &&
                  !slide.imageUrl.includes("images.unsplash.com")
                }
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
