"use client";

import { useReducedMotion } from "framer-motion";

type Petal = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: number;
  drift: string;
  hue: "blush" | "burgundy" | "deep";
};

/** Fewer petals + CSS keyframes (GPU-friendly) instead of 28 Framer loops. */
const PETALS: Petal[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: `${6 + ((i * 19) % 88)}%`,
  delay: `${(i % 8) * 0.18}s`,
  duration: `${4.2 + (i % 4) * 0.55}s`,
  size: 12 + (i % 5) * 3,
  drift: `${(i % 2 === 0 ? 1 : -1) * (18 + (i % 4) * 10)}px`,
  hue: (["blush", "burgundy", "deep"] as const)[i % 3],
}));

const fills: Record<Petal["hue"], string> = {
  blush: "#e7b8b4",
  burgundy: "#8b3a48",
  deep: "#582b35",
};

function PetalShape({ size, fill }: { size: number; fill: string }) {
  return (
    <svg width={size} height={size * 1.35} viewBox="0 0 40 54" aria-hidden>
      <ellipse cx="20" cy="28" rx="14" ry="22" fill={fill} opacity="0.9" />
      <ellipse cx="20" cy="22" rx="8" ry="14" fill="#faf7f1" opacity="0.2" />
    </svg>
  );
}

/** Falling rose petals via CSS 3D transforms (no per-frame JS). */
export function RosePetals({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden [perspective:900px]"
      aria-hidden
    >
      {PETALS.map((p) => (
        <div
          key={p.id}
          className="rose-petal absolute top-[-12%] will-change-transform"
          style={{
            left: p.left,
            ["--petal-delay" as string]: p.delay,
            ["--petal-duration" as string]: p.duration,
            ["--petal-drift" as string]: p.drift,
          }}
        >
          <PetalShape size={p.size} fill={fills[p.hue]} />
        </div>
      ))}
    </div>
  );
}
