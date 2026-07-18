import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Providers } from "@/app/providers";
import { TabSessionGate } from "@/components/auth/tab-session-gate";
import { SiteLogo } from "@/components/brand/site-logo";
import { WelcomeSplash } from "@/components/welcome/welcome-splash";
import { AdminNav } from "./admin-nav";

export const metadata = { title: "Admin" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates /admin; this is defence in depth for the layout
  // and everything under it.
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "STAFF")) {
    redirect("/login?callbackUrl=/admin");
  }

  return (
    <Providers>
      <TabSessionGate callbackPath="/admin">
        <WelcomeSplash greeting="Welcome to your shop admin" />
        <div className="flex min-h-screen">
          <aside className="flex w-60 shrink-0 flex-col bg-burgundy text-ivory">
            <Link href="/admin" className="block px-5 py-5">
              <SiteLogo
                size={40}
                nameClassName="font-display text-base leading-tight text-ivory"
              />
              <span className="mt-1.5 block text-xs uppercase tracking-[0.2em] text-blush">
                Shop admin
              </span>
            </Link>
            <AdminNav permissions={session.user.permissions} />
            <div className="border-t border-ivory/15 px-5 py-4">
              <p className="truncate text-xs text-ivory/70">{session.user.email}</p>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <Link href="/" className="text-blush hover:text-ivory">
                  View shop
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <button type="submit" className="text-blush hover:text-ivory">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </aside>
          <main className="min-w-0 flex-1 bg-ivory px-6 py-8 sm:px-8">
            {children}
          </main>
        </div>
      </TabSessionGate>
    </Providers>
  );
}
