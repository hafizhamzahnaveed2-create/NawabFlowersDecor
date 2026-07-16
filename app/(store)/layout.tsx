import { Providers } from "@/app/providers";
import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { AnnouncementBar } from "@/components/storefront/announcement-bar";
import { PromoPopup } from "@/components/storefront/promo-popup";
import { getPublishedBlock } from "@/lib/repositories/content";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const popup = await getPublishedBlock("popup.main");

  return (
    <Providers>
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
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
