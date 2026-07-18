"use client";

import { SITE_NAME } from "@/lib/brand";

export function ContactWhatsApp({ number }: { number: string }) {
  const digits = number.replace(/\D/g, "");
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(
    `Assalamualaikum — I’d like to enquire with ${SITE_NAME}.`,
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
    >
      Chat on WhatsApp
    </a>
  );
}
