import { Suspense } from "react";
import { SITE_NAME } from "@/lib/brand";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-14 sm:py-20">
      <div className="surface-panel w-full max-w-md px-6 py-8 sm:px-8 sm:py-10">
        <p className="section-eyebrow">Welcome back</p>
        <h1 className="mt-2 font-display text-3xl text-burgundy">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Access your orders, wishlist, and loyalty at {SITE_NAME}.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
