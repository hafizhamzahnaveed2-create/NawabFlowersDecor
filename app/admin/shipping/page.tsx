import { requirePagePermission } from "../require-page-permission";
import {
  listDeliveryZones,
  listTaxRules,
} from "@/lib/repositories/admin/shipping";
import { getDeliveryScheduleSettings } from "@/lib/repositories/settings";
import { ShippingManager } from "./shipping-manager";

export const metadata = { title: "Delivery & tax · Admin" };

export default async function AdminShippingPage() {
  await requirePagePermission("settings.write");
  const [zones, taxRules, schedule] = await Promise.all([
    listDeliveryZones(),
    listTaxRules(),
    getDeliveryScheduleSettings(),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl text-burgundy">Delivery & tax</h1>
      <p className="mt-1 text-ink/60">
        Delivery date rules, neighbourhood fees, and sales tax. Most specific
        area match wins at checkout.
      </p>
      <div className="mt-6">
        <ShippingManager
          initialZones={zones}
          initialTaxRules={taxRules}
          schedule={{
            sameDayDelivery: schedule.sameDayDelivery,
            maxLeadDays: schedule.maxLeadDays,
          }}
        />
      </div>
    </div>
  );
}
