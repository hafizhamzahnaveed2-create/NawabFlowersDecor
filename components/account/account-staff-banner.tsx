"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_TAB_EVENT, hasAuthTabSession } from "@/lib/auth-session-tab";

/** Only show shop-admin CTA when this tab has a live login marker. */
export function AccountStaffBanner() {
  const [tabOk, setTabOk] = useState(false);

  useEffect(() => {
    const sync = () => setTabOk(hasAuthTabSession());
    sync();
    window.addEventListener(AUTH_TAB_EVENT, sync);
    return () => window.removeEventListener(AUTH_TAB_EVENT, sync);
  }, []);

  if (!tabOk) return null;

  return (
    <Link
      href="/admin"
      className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-petal bg-burgundy px-5 py-4 text-ivory transition-colors hover:bg-burgundy-deep"
    >
      <div>
        <p className="font-display text-xl">Shop admin</p>
        <p className="mt-0.5 text-sm text-ivory/75">
          Products, orders, settings, and the rest of the shop tools.
        </p>
      </div>
      <span className="text-sm font-medium">Open dashboard →</span>
    </Link>
  );
}
