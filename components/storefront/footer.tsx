import Link from "next/link";
import { NewsletterForm } from "@/components/storefront/newsletter-form";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-stone bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-xl text-burgundy">
            Nawab Flowers Decorr
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/60">
            Fresh stems, hand-tied bouquets, and build-your-own arrangements —
            delivered on time, every time.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-sage">
            Shop
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/builder" className="hover:text-burgundy">
                Build your own
              </Link>
            </li>
            <li>
              <Link href="/category/bouquets" className="hover:text-burgundy">
                Bouquets
              </Link>
            </li>
            <li>
              <Link
                href="/category/raw-materials"
                className="hover:text-burgundy"
              >
                Raw Materials
              </Link>
            </li>
            <li>
              <Link
                href="/category/gift-addons"
                className="hover:text-burgundy"
              >
                Gift Add-ons
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-sage">
            Account
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/account" className="hover:text-burgundy">
                My orders
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-burgundy">
                Cart
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-sage">
            Newsletter
          </h3>
          <p className="mt-3 text-sm text-ink/60">
            Occasion reminders and seasonal arrangements — no spam.
          </p>
          <NewsletterForm />
        </div>
      </div>
      <div className="border-t border-stone py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} Nawab Flowers Decorr
      </div>
    </footer>
  );
}
