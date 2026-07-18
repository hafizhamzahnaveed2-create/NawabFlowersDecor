import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/storefront/hero";
import { ProductRail } from "@/components/storefront/product-rail";
import { PromoBanners } from "@/components/storefront/promo-banners";
import { FlashSaleStrip } from "@/components/storefront/flash-sale-strip";
import {
  getBestSellers,
  getNewArrivals,
  getSaleProducts,
} from "@/lib/repositories/products";
import { listCategories } from "@/lib/repositories/categories";
import { listPublishedByKind } from "@/lib/repositories/content";

export const revalidate = 300;

const categoryImages: Record<string, string> = {
  bouquets:
    "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=800&q=80",
  decorations:
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
  "raw-materials":
    "https://images.unsplash.com/photo-1459156212016-c812468e2115?w=800&q=80",
  "gift-addons":
    "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&q=80",
};

export default async function HomePage() {
  const [
    bestSellers,
    newArrivals,
    saleProducts,
    categories,
    heroSlides,
    banners,
  ] = await Promise.all([
    getBestSellers(8),
    getNewArrivals(8),
    getSaleProducts(8),
    listCategories(),
    listPublishedByKind("HERO_SLIDE"),
    listPublishedByKind("BANNER"),
  ]);

  return (
    <>
      <Hero
        slides={heroSlides.map((s) => ({
          title: s.title,
          body: s.body,
          imageUrl: s.imageUrl,
          videoUrl:
            typeof s.data?.videoUrl === "string" ? s.data.videoUrl : null,
          linkUrl: s.linkUrl,
        }))}
      />

      <FlashSaleStrip products={saleProducts} />

      <PromoBanners banners={banners} />

      <section className="page-section mx-auto max-w-6xl px-6">
        <p className="section-eyebrow">Collections</p>
        <h2 className="section-title mt-2">Browse the shop</h2>
        <p className="mt-2 max-w-xl text-ink/60">
          Bouquets, décor, stems, and the finishing gifts that complete every
          arrangement.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group relative aspect-[3/2] overflow-hidden rounded-petal bg-burgundy/25 shadow-bloom transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-bloom-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {categoryImages[category.slug] && (
                <Image
                  src={categoryImages[category.slug]}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-2xl text-ivory">
                  {category.name}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-sm text-ivory/80">
                  {category.subCategories.map((s) => s.name).join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ProductRail
        title="Best sellers"
        subtitle="What Lahore keeps coming back for"
        products={bestSellers}
        href="/category/bouquets?sort=best-selling"
      />
      <ProductRail
        title="New arrivals"
        subtitle="Fresh this week"
        products={newArrivals}
        href="/category/bouquets?sort=newest"
      />
      <ProductRail
        title="On sale"
        subtitle="Beautiful, for less"
        products={saleProducts}
        href="/category/bouquets?onSale=true"
      />
    </>
  );
}
