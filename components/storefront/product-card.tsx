import Image from "next/image";
import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/repositories/products";
import { isSaleActive } from "@/lib/pricing";
import { canOptimizeImage } from "@/lib/images";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/storefront/price";

// CSS-only 3D tilt + lift — GPU transforms, no JS, reduced-motion safe.
export function ProductCard({ product }: { product: ProductCardData }) {
  const saleActive = isSaleActive(product);
  const soldOut = product.stock <= 0;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="card-3d group block overflow-hidden rounded-petal bg-white shadow-bloom"
    >
      <div className="card-3d-inner">
        <div className="relative aspect-[4/5] overflow-hidden bg-stone/40">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              unoptimized={!canOptimizeImage(product.imageUrl)}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink/30">
              No photo yet
            </div>
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-burgundy/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:group-hover:opacity-0"
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {saleActive && <Badge variant="sale">Sale</Badge>}
            {product.isNewArrival && <Badge variant="new">New</Badge>}
            {product.isBestSeller && (
              <Badge variant="bestseller">Best seller</Badge>
            )}
          </div>
          {soldOut && (
            <div className="absolute inset-x-0 bottom-0 bg-ink/70 py-1.5 text-center text-sm text-ivory">
              Sold out
            </div>
          )}
        </div>
        <div className="px-4 py-3.5">
          <h3 className="truncate font-medium text-ink transition-colors duration-200 group-hover:text-burgundy">
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
      </div>
    </Link>
  );
}
