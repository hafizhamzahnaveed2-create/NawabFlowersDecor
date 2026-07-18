"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SITE_LOGO, SITE_NAME, WELCOME_SEEN_KEY } from "@/lib/brand";
import { RosePetals } from "./rose-petals";

type Phase = "idle" | "show" | "fly" | "done";

/**
 * Full-screen welcome: logo + greeting + rose petals, then the logo flies
 * into `#site-brand-logo` in the header / admin sidebar.
 * Plays once per browser session; login clears the flag so it plays again.
 */
export function WelcomeSplash({
  greeting = `Welcome to ${SITE_NAME}`,
}: {
  greeting?: string;
}) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("idle");
  const [fly, setFly] = useState<{
    x: number;
    y: number;
    scale: number;
  } | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("idle");
  const finishingRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(WELCOME_SEEN_KEY) === "1") {
        setPhase("done");
        return;
      }
    } catch {
      /* private mode */
    }
    setPhase("show");
  }, []);

  useEffect(() => {
    if (phase === "show" || phase === "fly") {
      document.documentElement.dataset.welcome = "active";
    } else {
      delete document.documentElement.dataset.welcome;
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "show") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "show") return;
    const holdMs = reduced ? 900 : 3200;
    const timer = window.setTimeout(() => beginFly(), holdMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced]);

  function markSeen() {
    try {
      sessionStorage.setItem(WELCOME_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  function finish() {
    if (finishingRef.current) return;
    finishingRef.current = true;
    markSeen();
    setPhase("done");
    delete document.documentElement.dataset.welcome;
  }

  function beginFly() {
    if (phaseRef.current === "fly" || phaseRef.current === "done") return;

    const target = document.getElementById("site-brand-logo");
    const source = logoRef.current;
    if (!target || !source) {
      finish();
      return;
    }

    // Temporarily show target to measure, then hide again via data-welcome
    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();

    const fromCx = from.left + from.width / 2;
    const fromCy = from.top + from.height / 2;
    const toCx = to.left + to.width / 2;
    const toCy = to.top + to.height / 2;

    setFly({
      x: toCx - fromCx,
      y: toCy - fromCy,
      scale: Math.max(0.18, to.width / Math.max(from.width, 1)),
    });
    setPhase("fly");
  }

  const visible = phase === "show" || phase === "fly";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-ivory via-[#f7f0e8] to-blush/30"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          role="dialog"
          aria-label="Welcome"
          aria-modal="true"
        >
          <RosePetals active={phase === "show" && !reduced} />

          <div className="relative z-10 flex flex-col items-center px-6 text-center">
            <motion.div
              ref={logoRef}
              className="relative"
              initial={reduced ? false : { opacity: 0, scale: 0.85, y: 16 }}
              animate={
                phase === "fly" && fly
                  ? {
                      x: fly.x,
                      y: fly.y,
                      scale: fly.scale,
                      opacity: 1,
                    }
                  : { opacity: 1, scale: 1, y: 0, x: 0 }
              }
              transition={
                phase === "fly"
                  ? {
                      duration: reduced ? 0.35 : 0.85,
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
              }
              onAnimationComplete={() => {
                if (phaseRef.current === "fly") finish();
              }}
            >
              <Image
                src={SITE_LOGO}
                alt={SITE_NAME}
                width={220}
                height={220}
                priority
                className="size-[min(52vw,220px)] rounded-full object-cover shadow-[0_20px_60px_rgba(88,43,53,0.28)] ring-2 ring-burgundy/15"
              />
            </motion.div>

            <motion.div
              className="mt-8"
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={
                phase === "fly"
                  ? { opacity: 0, y: -8 }
                  : { opacity: 1, y: 0 }
              }
              transition={{
                duration: 0.45,
                delay: phase === "show" ? 0.25 : 0,
              }}
            >
              <p className="text-sm uppercase tracking-[0.28em] text-sage">
                Established with care
              </p>
              <h2 className="mt-3 font-display text-3xl text-burgundy sm:text-4xl">
                {greeting}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-base text-ink/70">
                Fresh stems, hand-tied bouquets, and décor for every occasion.
              </p>
            </motion.div>
          </div>

          <button
            type="button"
            onClick={() => beginFly()}
            className="absolute bottom-8 z-10 text-sm font-medium text-ink/50 underline-offset-4 transition-colors hover:text-burgundy hover:underline"
          >
            Skip welcome
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Call after a successful login so the welcome plays again on the next page. */
export function resetWelcomeForLogin() {
  try {
    sessionStorage.removeItem(WELCOME_SEEN_KEY);
  } catch {
    /* ignore */
  }
}
