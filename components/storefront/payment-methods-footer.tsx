"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PaymentMethodIcon } from "@/components/storefront/brand-icons";

export type PaymentAccountPublic = {
  id: string;
  name: string;
  slug: string;
  accountTitle: string;
  accountNumber: string;
  iconKey: string;
  instructions: string | null;
};

export function PaymentMethodsFooter({
  accounts,
}: {
  accounts: PaymentAccountPublic[];
}) {
  const [open, setOpen] = useState<PaymentAccountPublic | null>(null);
  if (accounts.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sage">
            We accept
          </p>
          <p className="mt-1 text-sm text-ink/55">
            Tap a method for account details — JazzCash, EasyPaisa, or bank
            transfer.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-2 sm:justify-end">
          {accounts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setOpen(a)}
                className="inline-flex h-11 items-center rounded-lg border border-stone bg-white px-3 shadow-[0_1px_0_rgba(43,39,36,0.04)] transition-colors hover:border-burgundy/25 hover:bg-ivory"
                aria-label={`${a.name} account details`}
              >
                <PaymentMethodIcon
                  iconKey={a.iconKey}
                  className="h-8 w-auto"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pay-detail-title"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-md rounded-petal border border-stone bg-ivory p-6 shadow-bloom-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-stone pb-4">
              <PaymentMethodIcon
                iconKey={open.iconKey}
                className="h-9"
              />
              <h2
                id="pay-detail-title"
                className="sr-only"
              >
                {open.name}
              </h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-ink/50">Account title</dt>
                <dd className="mt-0.5 font-medium">{open.accountTitle}</dd>
              </div>
              <div>
                <dt className="text-ink/50">Account / IBAN</dt>
                <dd className="mt-0.5 font-mono text-base">{open.accountNumber}</dd>
              </div>
              {open.instructions && (
                <div>
                  <dt className="text-ink/50">Instructions</dt>
                  <dd className="mt-0.5 whitespace-pre-line text-ink/75">
                    {open.instructions}
                  </dd>
                </div>
              )}
            </dl>
            <Button
              type="button"
              variant="secondary"
              className="mt-6"
              onClick={() => setOpen(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
