import {
  getWhatsAppNumber,
  listSocialLinks,
  getMaintenanceSettings,
  getFeatureFlags,
} from "@/lib/repositories/settings";
import { requirePagePermission } from "../require-page-permission";
import { SettingsForms } from "./settings-forms";

export const metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  await requirePagePermission("settings.write");
  const [whatsapp, socials, maintenance, features] = await Promise.all([
    getWhatsAppNumber(),
    listSocialLinks(),
    getMaintenanceSettings(),
    getFeatureFlags(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Settings</h1>
      <p className="mt-1 text-ink/60">
        WhatsApp number, social profiles, maintenance mode, and storefront
        features — no deploy needed.
      </p>
      <div className="mt-6">
        <SettingsForms
          whatsapp={whatsapp}
          socials={socials}
          maintenance={maintenance}
          features={features}
        />
      </div>
    </div>
  );
}
