import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/brand";
import { getWhatsAppNumber } from "@/lib/repositories/settings";
import { ContactWhatsApp } from "./contact-whatsapp";

export const metadata: Metadata = { title: "Contact us" };

export default async function ContactPage() {
  const whatsapp = await getWhatsAppNumber();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-4xl text-burgundy">Contact us</h1>
      <p className="mt-2 text-ink/70">
        Planning a wedding, stage, bridal room, or a special bouquet?{" "}
        {SITE_NAME} is here — message us and we’ll help you choose.
      </p>

      <div className="mt-10 space-y-6">
        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">WhatsApp</h2>
          <p className="mt-2 text-sm text-ink/65">
            Fastest way to share photos, dates, and décor ideas. We usually reply
            during shop hours.
          </p>
          {whatsapp ? (
            <div className="mt-4">
              <ContactWhatsApp number={whatsapp} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/60">
              WhatsApp number will appear here once set in shop settings.
            </p>
          )}
        </section>

        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">What we can help with</h2>
          <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm text-ink/75">
            <li>Flower &amp; specialty bouquets (chocolate, currency, and more)</li>
            <li>Car, stage, bridal room, and event decorations</li>
            <li>Custom Build-Your-Own arrangements</li>
            <li>Order status and delivery questions</li>
          </ul>
        </section>

        <section className="rounded-petal border border-stone bg-white p-6">
          <h2 className="font-display text-xl text-burgundy">More help</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/faq" className="text-sage hover:text-burgundy">
                Frequently asked questions
              </Link>
            </li>
            <li>
              <Link
                href="/policies/shipping"
                className="text-sage hover:text-burgundy"
              >
                Shipping &amp; delivery
              </Link>
            </li>
            <li>
              <Link href="/category/decorations" className="text-sage hover:text-burgundy">
                Browse decorations
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
