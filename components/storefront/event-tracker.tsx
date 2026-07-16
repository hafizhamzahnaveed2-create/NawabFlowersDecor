"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "nawab-analytics-sid";

function getSessionId() {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

export function trackEvent(payload: {
  kind:
    | "page_view"
    | "product_view"
    | "add_to_cart"
    | "cta_click"
    | "checkout_start";
  path?: string;
  productId?: string;
  meta?: Record<string, unknown>;
}) {
  const sessionId = getSessionId();
  const body = JSON.stringify({
    ...payload,
    path:
      payload.path ??
      (typeof window !== "undefined" ? window.location.pathname : undefined),
    sessionId,
  });
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* analytics must not break shopping */
  });
}

/** Fires page_view on route changes (storefront layout). */
export function EventTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    trackEvent({ kind: "page_view", path: pathname });
  }, [pathname]);

  return null;
}

export function TrackProductView({ productId }: { productId: string }) {
  useEffect(() => {
    trackEvent({ kind: "product_view", productId });
  }, [productId]);
  return null;
}
