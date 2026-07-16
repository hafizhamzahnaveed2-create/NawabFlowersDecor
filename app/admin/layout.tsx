import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Providers } from "@/app/providers";

export const metadata = { title: "Admin" };

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/builder", label: "Builder" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/content", label: "Content" },
];

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
      <div className="flex min-h-screen">
        <aside className="flex w-56 shrink-0 flex-col bg-burgundy text-ivory">
          <Link href="/admin" className="px-5 py-5">
            <span className="font-display text-xl">Nawab</span>
            <span className="mt-0.5 block text-xs uppercase tracking-[0.2em] text-blush">
              Shop admin
            </span>
          </Link>
          <nav className="flex-1 px-3" aria-label="Admin">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-ivory/85 transition-colors hover:bg-burgundy-deep hover:text-ivory"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
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
        <main className="min-w-0 flex-1 bg-ivory px-8 py-8">{children}</main>
      </div>
    </Providers>
  );
}
