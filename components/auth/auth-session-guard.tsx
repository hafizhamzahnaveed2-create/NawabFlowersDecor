"use client";

import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  AUTH_TAB_CHANNEL,
  AUTH_TAB_SESSION_KEY,
  clearAuthTabSession,
  markAuthTabSession,
} from "@/lib/auth-session-tab";

/**
 * Auth cookies can survive browser restarts. We also require a sessionStorage
 * marker (set on login) so closing the tab/window ends the session when the
 * site is opened again. Other open tabs keep the session alive via BroadcastChannel.
 */
export function AuthSessionGuard() {
  const { status } = useSession();

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel(AUTH_TAB_CHANNEL);
    bc.onmessage = (event) => {
      if (
        event.data === "ping" &&
        sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1"
      ) {
        bc.postMessage("alive");
      }
    };
    return () => bc.close();
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      clearAuthTabSession();
      return;
    }
    if (status !== "authenticated") return;

    if (sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1") return;

    let cancelled = false;
    let peerAlive = false;

    const endStaleSession = () => {
      const path = window.location.pathname;
      const needsLogin =
        path.startsWith("/admin") || path.startsWith("/account");
      void signOut({
        callbackUrl: needsLogin
          ? `/login?callbackUrl=${encodeURIComponent(path)}`
          : "/",
      });
    };

    if (typeof BroadcastChannel === "undefined") {
      endStaleSession();
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
      if (cancelled) return;
      bc.close();
      if (peerAlive || sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1") {
        markAuthTabSession();
        return;
      }
      endStaleSession();
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      bc.close();
    };
  }, [status]);

  return null;
}
