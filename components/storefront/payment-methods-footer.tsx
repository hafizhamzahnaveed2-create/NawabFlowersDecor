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
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-sage">
          Pay ahead
        </h3>
        <p className="mt-2 text-sm text-ink/60">
          Transfer details for JazzCash, EasyPaisa, and bank.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2">
          {accounts.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setOpen(a)}
                className="flex items-center gap-2 rounded-lg border border-stone bg-white px-3 py-2 text-sm transition-colors hover:border-sage hover:text-burgundy"
                aria-label={`${a.name} account details`}
              >
                <PaymentMethodIcon iconKey={a.iconKey} className="size-7" />
                <span>{a.name}</span>
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
            <div className="flex items-center gap-3">
              <PaymentMethodIcon iconKey={open.iconKey} className="size-10" />
              <h2
                id="pay-detail-title"
                className="font-display text-2xl text-burgundy"
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
