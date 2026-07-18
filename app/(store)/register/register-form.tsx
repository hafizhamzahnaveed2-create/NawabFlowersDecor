"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerSchema } from "@/lib/validation/auth";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not create your account");
      }

      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      if (result?.error) {
        router.push("/login");
        return;
      }

      const callback = searchParams.get("callbackUrl");
      router.push(callback && callback.startsWith("/") ? callback : "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account");
      setSubmitting(false);
    }
  }

  const loginHref = searchParams.get("callbackUrl")
    ? `/login?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl")!)}`
    : "/login";

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 shadow-bloom placeholder:text-ink/40"
            placeholder="Your name"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5 shadow-bloom"
          />
          <p className="mt-1.5 text-xs text-ink/50">At least 8 characters.</p>
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
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-burgundy hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
