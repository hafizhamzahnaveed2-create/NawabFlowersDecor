import {
  getWhatsAppNumber,
  listSocialLinks,
  getMaintenanceSettings,
  getFeatureFlags,
  getLoyaltySettings,
} from "@/lib/repositories/settings";
import { requirePagePermission } from "../require-page-permission";
import { SettingsForms } from "./settings-forms";

export const metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  await requirePagePermission("settings.write");
  const [whatsapp, socials, maintenance, features, loyalty] = await Promise.all([
    getWhatsAppNumber(),
    listSocialLinks(),
    getMaintenanceSettings(),
    getFeatureFlags(),
    getLoyaltySettings(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Settings</h1>
      <p className="mt-1 text-ink/60">
        WhatsApp, social links, loyalty points, maintenance mode, and
        storefront features — no deploy needed.
      </p>
      <div className="mt-6">
        <SettingsForms
          whatsapp={whatsapp}
          socials={socials}
          maintenance={maintenance}
          features={features}
          loyalty={loyalty}
        />
      </div>
    </div>
  );
}
