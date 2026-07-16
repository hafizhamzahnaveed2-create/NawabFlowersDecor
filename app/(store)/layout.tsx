import { Providers } from "@/app/providers";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { PromoPopup } from "@/components/storefront/promo-popup";
import { EventTracker } from "@/components/storefront/event-tracker";
import { WhatsAppFloat } from "@/components/storefront/whatsapp-float";
import { getPublishedBlock } from "@/lib/repositories/content";
import { getWhatsAppNumber } from "@/lib/repositories/settings";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [popup, whatsapp] = await Promise.all([
    getPublishedBlock("popup.main"),
    getWhatsAppNumber(),
  ]);

  return (
    <Providers>
      <EventTracker />
      <AnnouncementBar />
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
