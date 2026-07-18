import Link from "next/link";
import { listCategories } from "@/lib/repositories/categories";
import { SiteLogo } from "@/components/brand/site-logo";
import { CartButton } from "@/components/storefront/cart-button";
import { HeaderAuth } from "@/components/storefront/header-auth";

export async function Header() {
  const categories = await listCategories();

  return (
    <header className="sticky top-0 z-30 border-b border-stone/70 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link
          href="/"
          className="shrink-0"
          aria-label="Nawab Flowers Decor home"
        >
          <SiteLogo size={42} />
        </Link>

        <nav aria-label="Categories" className="hidden lg:block">
          <ul className="flex items-center gap-7">
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
                  className="text-sm font-medium text-ink/85 transition-colors hover:text-burgundy"
                >
                  {category.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contact"
                className="text-sm font-medium text-ink/85 transition-colors hover:text-burgundy"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-0.5">
          <HeaderAuth />
          <CartButton />
        </div>
      </div>

      <nav
        aria-label="Shop categories"
        className="border-t border-stone/60 lg:hidden"
      >
        <ul className="flex items-center gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <li className="shrink-0">
            <Link
              href="/builder"
              className="inline-flex rounded-full bg-burgundy/8 px-3 py-1.5 text-sm font-medium text-burgundy"
            >
              Build your own
            </Link>
          </li>
          {categories.map((category) => (
            <li key={category.id} className="shrink-0">
              <Link
                href={`/category/${category.slug}`}
                className="inline-flex rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-stone/50 hover:text-burgundy"
              >
                {category.name}
              </Link>
            </li>
          ))}
          <li className="shrink-0">
            <Link
              href="/contact"
              className="inline-flex rounded-full px-3 py-1.5 text-sm font-medium text-ink/80 hover:bg-stone/50 hover:text-burgundy"
            >
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
