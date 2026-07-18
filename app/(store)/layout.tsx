import { Providers } from "@/app/providers";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { NewsTicker } from "@/components/storefront/news-ticker";
import { PromoPopup } from "@/components/storefront/promo-popup";
import { EventTracker } from "@/components/storefront/event-tracker";
import { WhatsAppFloat } from "@/components/storefront/whatsapp-float";
import { WelcomeSplash } from "@/components/welcome/welcome-splash";
import { getPublishedBlock } from "@/lib/repositories/content";
import {
  getMaintenanceSettings,
  getWhatsAppNumber,
} from "@/lib/repositories/settings";
import { auth } from "@/lib/auth";
import { MaintenanceGate } from "./maintenance-gate";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [popup, whatsapp, maintenance, session] = await Promise.all([
    getPublishedBlock("popup.main"),
    getWhatsAppNumber(),
    getMaintenanceSettings(),
    auth(),
  ]);

  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  if (maintenance.enabled && !isStaff) {
    return (
      <Providers>
        <WelcomeSplash />
        <MaintenanceGate message={maintenance.message} />
      </Providers>
    );
  }

  return (
    <Providers>
      <WelcomeSplash />
      <EventTracker />
      <AnnouncementBar />
      <NewsTicker />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFloat number={whatsapp} />
      <PromoPopup
        popup={
          popup
            ? {
                title: popup.title,
                body: popup.body,
                linkUrl: popup.linkUrl,
                key: popup.key,
              }
            : null
        }
      />
    </Providers>
  );
}
