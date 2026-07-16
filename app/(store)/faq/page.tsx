import type { Metadata } from "next";
import { listPublishedByKind } from "@/lib/repositories/content";

export const metadata: Metadata = { title: "FAQ" };

export default async function FaqPage() {
  const faqs = await listPublishedByKind("FAQ");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-4xl text-burgundy">Frequently asked</h1>
      <p className="mt-2 text-ink/70">
        Delivery, freshness, and how Build-Your-Own works.
      </p>

      {faqs.length === 0 ? (
        <p className="mt-10 text-ink/60">
          FAQs are being written — check back soon, or message us from checkout.
        </p>
      ) : (
        <ul className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <li
              key={faq.id}
              className="rounded-petal border border-stone bg-white px-5 py-4"
            >
              <h2 className="font-display text-xl text-ink">
                {faq.title ?? "Question"}
              </h2>
              {faq.body && (
                <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/75">
                  {faq.body}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
