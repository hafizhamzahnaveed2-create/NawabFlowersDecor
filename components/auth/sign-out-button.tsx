"use client";

import { signOut } from "next-auth/react";
import { clearAuthTabSession } from "@/lib/auth-session-tab";

export function SignOutButton({
  className,
  children = "Sign out",
  callbackUrl = "/",
}: {
  className?: string;
  children?: React.ReactNode;
  callbackUrl?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        clearAuthTabSession();
        void signOut({ callbackUrl });
      }}
    >
      {children}
    </button>
  );
}
