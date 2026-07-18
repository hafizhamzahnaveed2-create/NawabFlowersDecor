"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  AUTH_TAB_CHANNEL,
  AUTH_TAB_SESSION_KEY,
  markAuthTabSession,
} from "@/lib/auth-session-tab";

/**
 * Auth cookies can survive browser restarts. We also require a sessionStorage
 * marker (set on login) so closing the tab/window ends the session when the
 * site is opened again. Other open tabs keep the session alive via BroadcastChannel.
 *
 * Important: never clear the marker on a brief "unauthenticated" flicker from
 * SessionProvider — that raced with login and caused refresh loops.
 */
export function AuthSessionGuard() {
  const { status } = useSession();
  const checkedRef = useRef(false);

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
    if (status !== "authenticated") {
      if (status === "unauthenticated") checkedRef.current = false;
      return;
    }

    if (sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1") {
      checkedRef.current = true;
      return;
    }

    // Don't fight the login/register forms — they set the marker on success.
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
      if (sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1") {
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

    // Give login navigation a moment to write the tab marker before we decide
    // this cookie is leftover from a closed browser session.
    const settle = window.setTimeout(() => {
      if (cancelled) return;
      if (sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1") {
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
        if (peerAlive || sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1") {
          markAuthTabSession();
          return;
        }
        endStaleSession();
      }, 200);
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(settle);
      window.clearTimeout(peerTimer);
      peerChannel?.close();
    };
  }, [status]);

  return null;
}
