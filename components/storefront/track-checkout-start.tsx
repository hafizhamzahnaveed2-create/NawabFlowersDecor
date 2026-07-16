"use client";

import { useEffect } from "react";
import { trackEvent } from "@/components/storefront/event-tracker";

export function TrackCheckoutStart() {
  useEffect(() => {
    trackEvent({ kind: "checkout_start", path: "/checkout" });
  }, []);
  return null;
}
