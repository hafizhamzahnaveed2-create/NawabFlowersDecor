"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { loginSchema } from "@/lib/validation/auth";
import { markAuthTabSession } from "@/lib/auth-session-tab";
import { resetWelcomeForLogin } from "@/components/welcome/welcome-splash";

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
    const result = await signIn("credentials", {
      ...parsed.data,
      redirect: false,
    });

    if (result?.error) {
      setSubmitting(false);
      setError("Incorrect email or password.");
      return;
    }

    const session = await getSession();
    const next = resolvePostLoginPath(
      session?.user?.role,
      searchParams.get("callbackUrl"),
    );
    markAuthTabSession();
    resetWelcomeForLogin();
    router.push(next);
    router.refresh();
  }

  const registerHref = searchParams.get("callbackUrl")
    ? `/register?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}`
    : "/register";

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 shadow-bloom placeholder:text-ink/40"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 shadow-bloom"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-burgundy">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-burgundy px-4 py-2.5 font-medium text-ivory transition-colors hover:bg-burgundy-deep disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
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
