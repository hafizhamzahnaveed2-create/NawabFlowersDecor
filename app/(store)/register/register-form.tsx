"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, signOut } from "next-auth/react";
import { registerSchema } from "@/lib/validation/auth";
import {
  clearAuthTabSession,
  markAuthTabSession,
} from "@/lib/auth-session-tab";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/field";

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

      await signOut({ redirect: false });
      clearAuthTabSession();
      markAuthTabSession();
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      if (result?.error) {
        clearAuthTabSession();
        router.push("/login");
        return;
      }

      markAuthTabSession();
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
          <Label htmlFor="name" required>
            Name
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Your name"
          />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
          />
          <FieldHint>At least 8 characters.</FieldHint>
        </div>

        <FieldError message={error ?? undefined} />

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
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
