import Link from "next/link";
import { listCategories } from "@/lib/repositories/categories";
import { SiteLogo } from "@/components/brand/site-logo";
import { CartButton } from "@/components/storefront/cart-button";
import { HeaderAuth } from "@/components/storefront/header-auth";

export async function Header() {
  const categories = await listCategories();

  return (
    <header className="sticky top-0 z-30 border-b border-stone bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="shrink-0" aria-label="Nawab Flowers Decor home">
          <SiteLogo size={44} />
        </Link>

        <nav aria-label="Categories" className="hidden md:block">
          <ul className="flex items-center gap-6">
            <li>
              <Link
                href="/builder"
                className="text-sm font-medium text-burgundy transition-colors hover:text-burgundy-deep"
              >
                Build your own
              </Link>
            </li>
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
          <HeaderAuth />
          <CartButton />
        </div>
      </div>

      {/* Mobile category nav */}
      <nav aria-label="Categories" className="border-t border-stone md:hidden">
        <ul className="flex items-center gap-5 overflow-x-auto px-6 py-2.5">
          <li className="shrink-0">
            <Link
              href="/builder"
              className="text-sm font-medium text-burgundy hover:text-burgundy-deep"
            >
              Build your own
            </Link>
          </li>
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
