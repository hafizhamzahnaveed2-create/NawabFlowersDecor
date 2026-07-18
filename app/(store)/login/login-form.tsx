"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { loginSchema } from "@/lib/validation/auth";
import {
  clearAuthTabSession,
  markAuthTabSession,
} from "@/lib/auth-session-tab";
import { resetWelcomeForLogin } from "@/components/welcome/welcome-splash";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

function resolvePostLoginPath(
  role: string | undefined,
  callbackUrl: string | null,
) {
  const isStaff = role === "ADMIN" || role === "STAFF";
  if (isStaff) {
    if (callbackUrl?.startsWith("/admin")) return callbackUrl;
    // Account / home are the default storefront destinations — send shop staff
    // to the dashboard instead so login feels like “open the shop tools”.
    if (!callbackUrl || callbackUrl === "/" || callbackUrl === "/account") {
      return "/admin";
    }
  }
  return callbackUrl ?? "/";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      // Drop any leftover session so switching accounts cannot reuse the old JWT.
      await signOut({ redirect: false });
      clearAuthTabSession();

      // Mark before signIn so AuthSessionGuard never treats this as a stale cookie.
      markAuthTabSession();
      const result = await signIn("credentials", {
        ...parsed.data,
        redirect: false,
      });

      if (result?.error) {
        clearAuthTabSession();
        setError("Incorrect email or password.");
        return;
      }

      const session = await getSession();
      // Guard against a stale client session still pointing at the previous user.
      if (
        session?.user?.email &&
        session.user.email.toLowerCase() !== parsed.data.email
      ) {
        clearAuthTabSession();
        await signOut({ redirect: false });
        setError("Could not switch accounts. Please try again.");
        return;
      }

      const next = resolvePostLoginPath(
        session?.user?.role,
        searchParams.get("callbackUrl"),
      );
      markAuthTabSession();
      resetWelcomeForLogin();
      router.push(next);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const registerHref = searchParams.get("callbackUrl")
    ? `/register?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}`
    : "/register";

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>

        <FieldError message={error ?? undefined} />

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        New here?{" "}
        <Link
          href={registerHref}
          className="font-medium text-burgundy hover:underline"
        >
          Create an account
        </Link>
      </p>
    </>
  );
}
