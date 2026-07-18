import { Suspense } from "react";
import { SITE_NAME } from "@/lib/brand";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-burgundy">Sign in</h1>
        <p className="mt-2 text-ink/70">Welcome back to {SITE_NAME}.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
