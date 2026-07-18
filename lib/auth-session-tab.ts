/** Marks an active browser-tab login. Cleared when the tab/window closes. */
export const AUTH_TAB_SESSION_KEY = "nfd-auth-tab";

export const AUTH_TAB_CHANNEL = "nfd-auth-tab";

export const AUTH_TAB_EVENT = "nfd-auth-tab";

export function hasAuthTabSession() {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(AUTH_TAB_SESSION_KEY) === "1";
}

/** Call right after a successful sign-in so this tab is treated as active. */
export function markAuthTabSession() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(AUTH_TAB_SESSION_KEY, "1");
  window.dispatchEvent(new Event(AUTH_TAB_EVENT));
}

export function clearAuthTabSession() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(AUTH_TAB_SESSION_KEY);
  window.dispatchEvent(new Event(AUTH_TAB_EVENT));
}
