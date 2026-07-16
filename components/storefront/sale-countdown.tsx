"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/use-hydrated";

function partsUntil(endsAt: Date, now: number) {
  const ms = Math.max(0, endsAt.getTime() - now);
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, done: ms <= 0 };
}

function formatParts(parts: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}) {
  return (
    <>
      {parts.days > 0 && `${parts.days}d `}
      {String(parts.hours).padStart(2, "0")}:
      {String(parts.minutes).padStart(2, "0")}:
      {String(parts.seconds).padStart(2, "0")}
    </>
  );
}

export function SaleCountdown({
  endsAt,
  label = "Sale ends in",
  className = "",
}: {
  endsAt: Date | string;
  label?: string;
  className?: string;
}) {
  // Parse once from the ISO/string prop so SSR and the first client render
  // share the same end timestamp. Never call Date.now() during render —
  // that caused hydration mismatches (e.g. seconds 43 vs 44).
  const endMs =
    typeof endsAt === "string"
      ? new Date(endsAt).getTime()
      : endsAt.getTime();
  const hydrated = useHydrated();
  const [parts, setParts] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    done: boolean;
  } | null>(null);

  useEffect(() => {
    if (Number.isNaN(endMs)) return;
    const end = new Date(endMs);
    const tick = () => setParts(partsUntil(end, Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endMs]);

  if (Number.isNaN(endMs)) return null;
  // Wait until after hydration before showing live clock digits.
  if (!hydrated || !parts || parts.done) return null;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 text-sm ${className}`}
      aria-live="polite"
    >
      <span className="font-medium text-burgundy">{label}</span>
      <span className="font-mono tabular-nums text-ink">
        {formatParts(parts)}
      </span>
    </div>
  );
}
