import { Suspense } from "react";
import { SITE_NAME } from "@/lib/brand";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-14 sm:py-20">
      <div className="surface-panel w-full max-w-md px-6 py-8 sm:px-8 sm:py-10">
        <p className="section-eyebrow">Join us</p>
        <h1 className="mt-2 font-display text-3xl text-burgundy">
          Create account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">
          Save orders, wishlist favourites, and loyalty points at {SITE_NAME}.
        </p>
        <Suspense>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}
