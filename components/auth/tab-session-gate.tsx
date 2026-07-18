"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  AUTH_TAB_CHANNEL,
  AUTH_TAB_EVENT,
  hasAuthTabSession,
  markAuthTabSession,
} from "@/lib/auth-session-tab";

/**
 * Blocks protected UI until this tab has a live login marker.
 * Prevents a leftover auth cookie from rendering admin/account chrome.
 */
export function TabSessionGate({
  children,
  callbackPath,
}: {
  children: React.ReactNode;
  callbackPath: string;
}) {
  const { status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      window.location.replace(
        `/login?callbackUrl=${encodeURIComponent(callbackPath)}`,
      );
      return;
    }

    if (hasAuthTabSession()) {
      setReady(true);
      return;
    }

    let cancelled = false;
    let peerAlive = false;

    const fail = () => {
      if (cancelled) return;
      void signOut({
        callbackUrl: `/login?callbackUrl=${encodeURIComponent(callbackPath)}`,
      });
    };

    if (typeof BroadcastChannel === "undefined") {
      fail();
      return;
    }

    const bc = new BroadcastChannel(AUTH_TAB_CHANNEL);
    bc.onmessage = (event) => {
      if (event.data === "alive") {
        peerAlive = true;
        markAuthTabSession();
      }
    };
    bc.postMessage("ping");

    const timer = window.setTimeout(() => {
      bc.close();
      if (cancelled) return;
      if (peerAlive || hasAuthTabSession()) {
        markAuthTabSession();
        setReady(true);
        return;
      }
      fail();
    }, 180);

    const onMark = () => {
      if (hasAuthTabSession()) setReady(true);
    };
    window.addEventListener(AUTH_TAB_EVENT, onMark);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      bc.close();
      window.removeEventListener(AUTH_TAB_EVENT, onMark);
    };
  }, [status, callbackPath]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-6 text-sm text-ink/60">
        Checking session…
      </div>
    );
  }

  return children;
}
