import Image from "next/image";
import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/repositories/products";
import { isSaleActive } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/storefront/price";

// Hover behaviour is physical and CSS-only: a slight lift, a softer/deeper
// shadow, and a gentle zoom on the photo. No JS needed, reduced-motion safe.
export function ProductCard({ product }: { product: ProductCardData }) {
  const saleActive = isSaleActive(product);
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block overflow-hidden rounded-petal bg-white shadow-bloom transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-bloom-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-stone/40">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.imageAlt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink/30">
            No photo yet
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {saleActive && <Badge variant="sale">Sale</Badge>}
          {product.isNewArrival && <Badge variant="new">New</Badge>}
          {product.isBestSeller && <Badge variant="bestseller">Best seller</Badge>}
        </div>
        {soldOut && (
          <div className="absolute inset-x-0 bottom-0 bg-ink/70 py-1.5 text-center text-sm text-ivory">
            Sold out
          </div>
        )}
      </div>
      <div className="px-4 py-3.5">
        <h3 className="truncate font-medium text-ink group-hover:text-burgundy">
          {product.name}
        </h3>
        <div className="mt-1">
          <Price
            price={product.price}
            salePrice={product.salePrice}
            isSaleActive={saleActive}
          />
        </div>
      </div>
    </Link>
  );
}
