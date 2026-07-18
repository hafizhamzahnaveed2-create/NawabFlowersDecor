"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  AUTH_TAB_CHANNEL,
  hasAuthTabSession,
  markAuthTabSession,
} from "@/lib/auth-session-tab";

/**
 * Clears leftover auth cookies when this browser tab was not the one that
 * signed in (e.g. tab closed and a new one opened).
 */
export function AuthSessionGuard() {
  const { status } = useSession();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(AUTH_TAB_CHANNEL);
    bc.onmessage = (event) => {
      if (event.data === "ping" && hasAuthTabSession()) {
        bc.postMessage("alive");
      }
    };
    return () => bc.close();
  }, []);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") checkedRef.current = false;
      return;
    }

    if (hasAuthTabSession()) {
      checkedRef.current = true;
      return;
    }

    const path = window.location.pathname;
    if (path.startsWith("/login") || path.startsWith("/register")) {
      return;
    }

    if (checkedRef.current) return;

    let cancelled = false;
    let peerAlive = false;
    let peerTimer = 0;
    let peerChannel: BroadcastChannel | null = null;

    const endStaleSession = () => {
      if (hasAuthTabSession()) {
        checkedRef.current = true;
        return;
      }
      const current = window.location.pathname;
      const needsLogin =
        current.startsWith("/admin") || current.startsWith("/account");
      void signOut({
        callbackUrl: needsLogin
          ? `/login?callbackUrl=${encodeURIComponent(current)}`
          : "/",
      });
    };

    const settle = window.setTimeout(() => {
      if (cancelled) return;
      if (hasAuthTabSession()) {
        checkedRef.current = true;
        return;
      }

      if (typeof BroadcastChannel === "undefined") {
        checkedRef.current = true;
        endStaleSession();
        return;
      }

      peerChannel = new BroadcastChannel(AUTH_TAB_CHANNEL);
      peerChannel.onmessage = (event) => {
        if (event.data === "alive") {
          peerAlive = true;
          markAuthTabSession();
        }
      };
      peerChannel.postMessage("ping");

      peerTimer = window.setTimeout(() => {
        peerChannel?.close();
        peerChannel = null;
        if (cancelled) return;
        checkedRef.current = true;
        if (peerAlive || hasAuthTabSession()) {
          markAuthTabSession();
          return;
        }
        endStaleSession();
      }, 150);
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(settle);
      window.clearTimeout(peerTimer);
      peerChannel?.close();
    };
  }, [status]);

  return null;
}
