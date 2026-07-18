"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SiteLogo } from "@/components/brand/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "@/app/admin/admin-nav";

export function AdminShell({
  email,
  permissions,
  children,
}: {
  email: string;
  permissions: string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const sidebar = (
    <>
      <Link href="/admin" className="block px-5 py-5" onClick={() => setOpen(false)}>
        <SiteLogo
          size={40}
          nameClassName="font-display text-base leading-tight text-ivory"
        />
        <span className="mt-1.5 block text-xs uppercase tracking-[0.2em] text-blush">
          Shop admin
        </span>
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AdminNav permissions={permissions} onNavigate={() => setOpen(false)} />
      </div>
      <div className="shrink-0 border-t border-ivory/15 px-5 py-4">
        <p className="truncate text-xs text-ivory/70">{email}</p>
        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          <Link href="/account" className="text-blush hover:text-ivory">
            Profile settings
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-blush hover:text-ivory">
              View shop
            </Link>
            <SignOutButton className="text-blush hover:text-ivory" />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col bg-burgundy text-ivory lg:flex">
        {sidebar}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(18rem,86vw)] flex-col bg-burgundy text-ivory shadow-bloom-lg">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone/80 bg-ivory/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-[var(--radius-control)] border border-stone bg-surface px-3 py-2 text-sm font-medium text-burgundy"
            aria-expanded={open}
            aria-controls="admin-mobile-nav"
          >
            Menu
          </button>
          <p className="truncate font-display text-lg text-burgundy">Shop admin</p>
        </header>
        <main
          id="admin-mobile-nav"
          className="min-w-0 flex-1 bg-ivory px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
