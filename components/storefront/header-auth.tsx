"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  AUTH_TAB_EVENT,
  hasAuthTabSession,
} from "@/lib/auth-session-tab";

/**
 * Auth-dependent header controls. Defaults to signed-out chrome until this
 * browser tab has a live login marker — so a leftover cookie after closing
 * the tab never shows "Shop admin" again.
 */
export function HeaderAuth() {
  const { data: session, status } = useSession();
  const [tabOk, setTabOk] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (status !== "authenticated") {
        setTabOk(false);
        return;
      }
      setTabOk(hasAuthTabSession());
    };
    sync();
    window.addEventListener(AUTH_TAB_EVENT, sync);
    return () => window.removeEventListener(AUTH_TAB_EVENT, sync);
  }, [status]);

  const signedIn = status === "authenticated" && tabOk;
  const isStaff =
    signedIn &&
    (session?.user?.role === "ADMIN" || session?.user?.role === "STAFF");

  return (
    <>
      {isStaff && (
        <Link
          href="/admin"
          className="mr-1 hidden rounded-lg bg-burgundy px-3 py-1.5 text-sm font-medium text-ivory transition-colors hover:bg-burgundy-deep sm:inline-flex"
        >
          Shop admin
        </Link>
      )}
      <Link
        href={signedIn ? "/account" : "/login"}
        className="rounded-lg p-2 text-ink transition-colors hover:bg-stone/50 hover:text-burgundy"
        aria-label={signedIn ? "My account" : "Sign in"}
      >
        <svg
          aria-hidden
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </Link>
    </>
  );
}
