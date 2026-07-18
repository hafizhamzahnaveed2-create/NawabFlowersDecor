"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { trackEvent } from "@/components/storefront/event-tracker";
import { SITE_NAME } from "@/lib/brand";
import { buttonClasses } from "@/components/ui/button";
import { isDirectVideoUrl, youtubeEmbedUrl } from "@/lib/hero-media";

export type HeroSlide = {
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  videoUrl?: string | null;
  linkUrl?: string | null;
};

const DEFAULTS: HeroSlide = {
  title: "Flowers that say it before you do",
  body: "Hand-tied bouquets for every occasion, individual stems for your own arrangements, and gifts to go with them.",
  imageUrl:
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=1600&q=80",
};

function HeroMedia({ slide }: { slide: HeroSlide }) {
  const videoUrl = slide.videoUrl?.trim() || null;
  const imageUrl = slide.imageUrl || DEFAULTS.imageUrl;

  if (videoUrl) {
    const yt = youtubeEmbedUrl(videoUrl);
    if (yt) {
      return (
        <iframe
          src={yt}
          title={slide.title || "Hero video"}
          className="absolute inset-0 h-full w-full scale-105 border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    if (isDirectVideoUrl(videoUrl) || videoUrl.startsWith("http")) {
      return (
        <video
          key={videoUrl}
          src={videoUrl}
          poster={imageUrl ?? undefined}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      );
    }
  }

  return (
    <Image
      src={imageUrl!}
      alt=""
      fill
      priority
      unoptimized={!!imageUrl && !imageUrl.includes("images.unsplash.com")}
      sizes="100vw"
      className="object-cover"
    />
  );
}

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const activeSlides =
    slides.length > 0
      ? slides.map((s) => ({
          title: s.title || DEFAULTS.title,
          body: s.body || DEFAULTS.body,
          imageUrl: s.imageUrl || DEFAULTS.imageUrl,
          videoUrl: s.videoUrl,
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
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  useEffect(() => {
    if (activeSlides.length < 2 || reducedMotion) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % activeSlides.length),
      7000,
    );
    return () => clearInterval(id);
  }, [activeSlides.length, reducedMotion]);

  const slide = activeSlides[index] ?? activeSlides[0];
  const mediaKey = slide.videoUrl || slide.imageUrl || String(index);

  return (
    <section
      ref={ref}
      className="relative isolate min-h-[78vh] overflow-hidden sm:min-h-[85vh]"
    >
      <motion.div
        style={reducedMotion ? undefined : { y }}
        className="absolute inset-0"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={mediaKey}
            className="absolute inset-0"
            initial={reducedMotion ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroMedia slide={slide} />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-ink/72 via-ink/45 to-ink/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-ink/25" />
      </motion.div>

      <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-6 pb-14 pt-28 sm:min-h-[85vh] sm:pb-20 sm:pt-32">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl"
        >
          <p className="text-xs font-medium uppercase tracking-[0.28em] text-blush">
            Fresh · Hand-tied · Delivered on time
          </p>
          <h1 className="mt-3 font-display text-5xl leading-[0.98] text-ivory sm:text-6xl lg:text-7xl">
            {SITE_NAME}
          </h1>
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              <p className="mt-5 font-display text-2xl leading-snug text-ivory/95 sm:text-3xl">
                {slide.title}
              </p>
              <p className="mt-3 max-w-md text-base leading-relaxed text-ivory/78 sm:text-lg">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={slide.linkUrl || "/builder"}
              onClick={() =>
                trackEvent({
                  kind: "cta_click",
                  meta: { label: "hero_build_your_own" },
                })
              }
              className={buttonClasses("primary", "lg")}
            >
              Build your own
            </Link>
            <Link
              href="/category/bouquets"
              onClick={() =>
                trackEvent({
                  kind: "cta_click",
                  meta: { label: "hero_shop_bouquets" },
                })
              }
              className="inline-flex items-center justify-center rounded-[var(--radius-control)] border border-ivory/40 bg-ivory/10 px-6 py-3 text-base font-medium text-ivory backdrop-blur-sm transition-colors hover:bg-ivory/20"
            >
              Shop bouquets
            </Link>
          </div>
          {activeSlides.length > 1 && (
            <div
              className="mt-8 flex gap-2"
              role="tablist"
              aria-label="Hero slides"
            >
              {activeSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 w-7 rounded-full transition-colors ${
                    i === index ? "bg-ivory" : "bg-ivory/35"
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
