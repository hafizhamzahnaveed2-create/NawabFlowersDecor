"use client";

import { motion, useReducedMotion } from "framer-motion";

type Petal = {
  id: number;
  left: string;
  delay: number;
  duration: number;
  size: number;
  rotate: number;
  drift: number;
  hue: "blush" | "burgundy" | "deep";
};

const PETALS: Petal[] = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${4 + ((i * 17) % 92)}%`,
  delay: (i % 10) * 0.12,
  duration: 3.2 + (i % 5) * 0.45,
  size: 14 + (i % 6) * 4,
  rotate: (i * 47) % 360,
  drift: (i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 12),
  hue: (["blush", "burgundy", "deep"] as const)[i % 3],
}));

const fills: Record<Petal["hue"], string> = {
  blush: "#e7b8b4",
  burgundy: "#8b3a48",
  deep: "#582b35",
};

function PetalShape({ size, fill }: { size: number; fill: string }) {
  return (
    <svg
      width={size}
      height={size * 1.35}
      viewBox="0 0 40 54"
      aria-hidden
      style={{ filter: "drop-shadow(0 2px 4px rgba(88,43,53,0.25))" }}
    >
      <ellipse cx="20" cy="28" rx="14" ry="22" fill={fill} opacity="0.92" />
      <ellipse cx="20" cy="22" rx="8" ry="14" fill="#faf7f1" opacity="0.22" />
      <path
        d="M20 8 C20 8 18 28 20 48"
        stroke="#3f1e26"
        strokeWidth="1.2"
        fill="none"
        opacity="0.35"
      />
    </svg>
  );
}

/** Falling / tumbling rose petals with light 3D perspective. */
export function RosePetals({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (!active || reduced) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ perspective: "900px" }}
      aria-hidden
    >
      {PETALS.map((p) => (
        <motion.div
          key={p.id}
          className="absolute top-[-12%]"
          style={{
            left: p.left,
            transformStyle: "preserve-3d",
          }}
          initial={{
            y: "-10vh",
            x: 0,
            opacity: 0,
            rotateX: 20,
            rotateY: p.rotate,
            rotateZ: p.rotate / 4,
          }}
          animate={{
            y: "115vh",
            x: [0, p.drift, p.drift * -0.4, p.drift * 0.6],
            opacity: [0, 1, 1, 0.85, 0],
            rotateX: [20, -30, 40, -15],
            rotateY: [p.rotate, p.rotate + 180, p.rotate + 360],
            rotateZ: [0, 80, 160],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0.4,
          }}
        >
          <PetalShape size={p.size} fill={fills[p.hue]} />
        </motion.div>
      ))}
    </div>
  );
}
