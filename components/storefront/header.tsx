import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCategories } from "@/lib/repositories/categories";
import { CartButton } from "@/components/storefront/cart-button";

export async function Header() {
  const [categories, session] = await Promise.all([listCategories(), auth()]);

  return (
    <header className="sticky top-0 z-30 border-b border-stone bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="shrink-0">
          <span className="font-display text-2xl text-burgundy">Nawab</span>
          <span className="ml-1.5 text-sm uppercase tracking-[0.2em] text-sage">
            Flowers Decorr
          </span>
        </Link>

        <nav aria-label="Categories" className="hidden md:block">
          <ul className="flex items-center gap-6">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="text-sm font-medium text-ink transition-colors hover:text-burgundy"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href={session?.user ? "/account" : "/login"}
            className="rounded-lg p-2 text-ink transition-colors hover:bg-stone/50 hover:text-burgundy"
            aria-label={session?.user ? "My account" : "Sign in"}
          >
            <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
          <CartButton />
        </div>
      </div>

      {/* Mobile category nav */}
      <nav aria-label="Categories" className="border-t border-stone md:hidden">
        <ul className="flex items-center gap-5 overflow-x-auto px-6 py-2.5">
          {categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                href={`/category/${category.slug}`}
                className="text-sm font-medium text-ink hover:text-burgundy"
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
