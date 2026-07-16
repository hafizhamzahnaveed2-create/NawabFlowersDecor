"use client";

import { useCart } from "@/lib/cart/store";
import { Button } from "@/components/ui/button";
import type { CustomBouquetSummary } from "@/lib/repositories/custom-bouquets";

export function ShareAddToCart({
  bouquet,
}: {
  bouquet: CustomBouquetSummary;
}) {
  const addCustomBouquet = useCart((s) => s.addCustomBouquet);

  return (
    <Button
      onClick={() =>
        addCustomBouquet({
          customBouquetId: bouquet.id,
          name: bouquet.name || "Custom bouquet",
          unitPrice: bouquet.totalPrice,
          imageUrl: bouquet.previewImageUrl,
        })
      }
    >
      Add to cart
    </Button>
  );
}
