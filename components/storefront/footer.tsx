import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { PaymentMethodsFooter } from "@/components/storefront/payment-methods-footer";
import { SocialPlatformIcon } from "@/components/storefront/brand-icons";
import { SITE_LOGO, SITE_NAME } from "@/lib/brand";
import { listCategories } from "@/lib/repositories/categories";
import {
  listPaymentAccounts,
  listSocialLinks,
} from "@/lib/repositories/settings";

export async function Footer() {
  const [socials, payments, categories] = await Promise.all([
    listSocialLinks(true),
    listPaymentAccounts(true),
    listCategories(),
  ]);

  return (
    <footer className="mt-16 border-t border-stone bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src={SITE_LOGO}
              alt=""
              width={40}
              height={40}
              className="rounded-full object-cover ring-1 ring-stone"
            />
            <p className="font-display text-xl text-burgundy">{SITE_NAME}</p>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/60">
            Fresh flowers, specialty bouquets, and event decorations — delivered
            and styled with care.
          </p>
          {socials.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3">
              {socials.map((s) => (
                <li key={s.id}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-stone text-ink/70 transition-colors hover:border-sage hover:text-burgundy"
                    aria-label={s.platform}
                  >
                    <SocialPlatformIcon platform={s.platform} />
                  </a>
                </li>
              ))}
            </ul>
          )}
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
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="hover:text-burgundy"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-sage">
            Help &amp; more
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/contact" className="hover:text-burgundy">
                Contact us
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-burgundy">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-burgundy">
                Journal
              </Link>
            </li>
            <li>
              <Link href="/policies/shipping" className="hover:text-burgundy">
                Shipping
              </Link>
            </li>
            <li>
              <Link href="/policies/returns" className="hover:text-burgundy">
                Returns
              </Link>
            </li>
            <li>
              <Link href="/account" className="hover:text-burgundy">
                My account
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

      {payments.length > 0 && (
        <div className="border-t border-stone bg-ivory/60">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <PaymentMethodsFooter accounts={payments} />
          </div>
        </div>
      )}

      <div className="border-t border-stone py-4 text-center text-xs text-ink/50">
        © {new Date().getFullYear()} {SITE_NAME}
      </div>
    </footer>
  );
}
