import { listPaymentAccounts } from "@/lib/repositories/settings";
import { PaymentAccountsManager } from "./payment-accounts-manager";
import { requirePagePermission } from "../require-page-permission";

export const metadata = { title: "Payment methods · Admin" };

export default async function AdminPaymentMethodsPage() {
  await requirePagePermission("payments.write");
  const accounts = await listPaymentAccounts();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Payment methods</h1>
      <p className="mt-1 text-ink/60">
        JazzCash, EasyPaisa, and bank accounts shown at checkout for manual
        payments. Changes go live immediately.
      </p>
      <div className="mt-6">
        <PaymentAccountsManager initial={accounts} />
      </div>
    </div>
  );
}
