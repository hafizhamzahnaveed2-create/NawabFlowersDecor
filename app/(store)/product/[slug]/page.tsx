import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/repositories/products";
import { isSaleActive } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/storefront/price";
import { AddToCart } from "@/components/storefront/add-to-cart";
import { ProductRail } from "@/components/storefront/product-rail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description?.slice(0, 160),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(
    product.id,
    product.category.slug,
    4,
  );
  const saleActive = isSaleActive(product);

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="text-sm text-ink/60">
          <Link href="/" className="hover:text-burgundy">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/category/${product.category.slug}`}
            className="hover:text-burgundy"
          >
            {product.category.name}
          </Link>
          {product.subCategory && (
            <>
              <span className="mx-2">/</span>
              <Link
                href={`/category/${product.category.slug}?sub=${product.subCategory.slug}`}
                className="hover:text-burgundy"
              >
                {product.subCategory.name}
              </Link>
            </>
          )}
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-petal bg-stone/40 shadow-bloom">
              {product.images[0] ? (
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].alt ?? product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink/30">
                  No photo yet
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.slice(1, 5).map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-square overflow-hidden rounded-lg bg-stone/40"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt ?? product.name}
                      fill
                      sizes="150px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchase panel */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex flex-wrap items-center gap-2">
              {saleActive && <Badge variant="sale">Sale</Badge>}
              {product.isNewArrival && <Badge variant="new">New</Badge>}
              {product.isBestSeller && (
                <Badge variant="bestseller">Best seller</Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-4xl text-burgundy">
              {product.name}
            </h1>
            {product.variants.length === 0 && (
              <div className="mt-3">
                <Price
                  price={product.price}
                  salePrice={product.salePrice}
                  isSaleActive={saleActive}
                  className="text-2xl"
                />
              </div>
            )}
            {product.description && (
              <p className="mt-5 leading-relaxed text-ink/75">
                {product.description}
              </p>
            )}

            <div className="mt-7">
              <AddToCart product={product} />
            </div>

            {product.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2 border-t border-stone pt-5">
                {product.tags.map((tag) => (
                  <span
                    key={tag.slug}
                    className="rounded-full bg-stone/60 px-3 py-1 text-xs text-ink/70"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductRail
        title="You may also like"
        products={related}
        href={`/category/${product.category.slug}`}
      />
    </>
  );
}
