"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CartDrawer = dynamic(
  () =>
    import("@/components/storefront/cart-drawer").then((m) => m.CartDrawer),
  { ssr: false },
);

const WhatsAppFloat = dynamic(
  () =>
    import("@/components/storefront/whatsapp-float").then(
      (m) => m.WhatsAppFloat,
    ),
  { ssr: false },
);

const PromoPopup = dynamic(
  () =>
    import("@/components/storefront/promo-popup").then((m) => m.PromoPopup),
  { ssr: false },
);

type PopupData = {
  title: string | null;
  body: string | null;
  linkUrl: string | null;
  key: string;
};

/**
 * Mount cart / WhatsApp / promo after first paint so the initial JS
 * graph stays lighter on every storefront route.
 */
export function DeferredOverlays({
  whatsapp,
  popup,
}: {
  whatsapp: string | null;
  popup: PopupData | null;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setReady(true);
    };

    const ric = window.requestIdleCallback?.bind(window);
    if (ric) {
      const id = ric(enable, { timeout: 1200 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(id);
      };
    }

    const t = setTimeout(enable, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <CartDrawer />
      <WhatsAppFloat number={whatsapp} />
      <PromoPopup popup={popup} />
    </>
  );
}
