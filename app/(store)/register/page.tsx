import { Suspense } from "react";
import { SITE_NAME } from "@/lib/brand";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-burgundy">Create account</h1>
        <p className="mt-2 text-ink/70">
          Join {SITE_NAME} — save your orders, wishlist, and loyalty points.
        </p>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </main>
  );
}
