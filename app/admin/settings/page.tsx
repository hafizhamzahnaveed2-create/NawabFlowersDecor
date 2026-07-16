import {
  getWhatsAppNumber,
  listSocialLinks,
} from "@/lib/repositories/settings";
import { SettingsForms } from "./settings-forms";

export const metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  const [whatsapp, socials] = await Promise.all([
    getWhatsAppNumber(),
    listSocialLinks(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Settings</h1>
      <p className="mt-1 text-ink/60">
        WhatsApp number and social profiles — no deploy needed.
      </p>
      <div className="mt-6">
        <SettingsForms whatsapp={whatsapp} socials={socials} />
      </div>
    </div>
  );
}
