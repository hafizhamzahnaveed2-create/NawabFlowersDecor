/** Marks an active browser-tab login. Cleared when the tab/window closes. */
export const AUTH_TAB_SESSION_KEY = "nfd-auth-tab";

export const AUTH_TAB_CHANNEL = "nfd-auth-tab";

/** Call right after a successful sign-in so this tab is treated as active. */
export function markAuthTabSession() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(AUTH_TAB_SESSION_KEY, "1");
}

export function clearAuthTabSession() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(AUTH_TAB_SESSION_KEY);
}
