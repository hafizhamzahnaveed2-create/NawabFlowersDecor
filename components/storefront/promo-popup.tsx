"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "nawab-popup-dismissed";

type PopupData = {
  title: string | null;
  body: string | null;
  linkUrl: string | null;
  key: string;
};

export function PromoPopup({ popup }: { popup: PopupData | null }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup?.title) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      if (map[popup.key]) return;
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [popup]);

  if (!popup?.title || !open) return null;

  function dismiss() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
      map[popup!.key] = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-popup-title"
    >
      <div className="w-full max-w-md rounded-petal border border-stone bg-ivory p-6 shadow-bloom-lg">
        <h2
          id="promo-popup-title"
          className="font-display text-2xl text-burgundy"
        >
          {popup.title}
        </h2>
        {popup.body && (
          <p className="mt-3 text-ink/75">{popup.body}</p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          {popup.linkUrl && (
            <Link
              href={popup.linkUrl}
              onClick={dismiss}
              className="inline-flex rounded-lg bg-burgundy px-4 py-2.5 font-medium text-ivory hover:bg-burgundy-deep"
            >
              See offer
            </Link>
          )}
          <Button type="button" variant="secondary" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
