"use client";

import { useEffect, useState } from "react";

function partsUntil(endsAt: Date) {
  const ms = Math.max(0, endsAt.getTime() - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, done: ms <= 0 };
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
  const end = typeof endsAt === "string" ? new Date(endsAt) : endsAt;
  const [parts, setParts] = useState(() => partsUntil(end));

  useEffect(() => {
    const id = setInterval(() => setParts(partsUntil(end)), 1000);
    return () => clearInterval(id);
  }, [end]);

  if (parts.done || Number.isNaN(end.getTime())) return null;

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 text-sm ${className}`}
      aria-live="polite"
    >
      <span className="font-medium text-burgundy">{label}</span>
      <span className="font-mono tabular-nums text-ink">
        {parts.days > 0 && `${parts.days}d `}
        {String(parts.hours).padStart(2, "0")}:
        {String(parts.minutes).padStart(2, "0")}:
        {String(parts.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}
