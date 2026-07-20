import Image from "next/image";
import Link from "next/link";
import type { ContentBlockDto } from "@/lib/repositories/content";
import { canOptimizeImage } from "@/lib/images";

export function PromoBanners({ banners }: { banners: ContentBlockDto[] }) {
  const visible = banners.filter(
    (b) => b.isPublished && !b.key.startsWith("popup."),
  );
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <div
        className={`grid gap-4 ${
          visible.length === 1 ? "sm:grid-cols-1" : "sm:grid-cols-2"
        }`}
      >
        {visible.map((b) => {
          const inner = (
            <div className="tile-3d-inner relative overflow-hidden rounded-petal bg-stone/40 shadow-bloom">
              {b.imageUrl ? (
                <div className="relative aspect-[21/9]">
                  <Image
                    src={b.imageUrl}
                    alt={b.title ?? ""}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    unoptimized={!canOptimizeImage(b.imageUrl)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/55 to-transparent" />
                  <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-6 sm:p-8">
                    {b.title && (
                      <h3 className="font-display text-2xl text-ivory sm:text-3xl">
                        {b.title}
                      </h3>
                    )}
                    {b.body && (
                      <p className="mt-2 text-sm text-ivory/85">{b.body}</p>
                    )}
                    {b.linkUrl && (
                      <span className="mt-4 inline-flex w-fit rounded-lg bg-ivory/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-burgundy transition-transform duration-300 group-hover:translate-x-0.5">
                        Shop now
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-burgundy/5 px-6 py-8">
                  {b.title && (
                    <h3 className="font-display text-2xl text-burgundy">
                      {b.title}
                    </h3>
                  )}
                  {b.body && (
                    <p className="mt-2 text-ink/70">{b.body}</p>
                  )}
                </div>
              )}
            </div>
          );
          return b.linkUrl ? (
            <Link
              key={b.id}
              href={b.linkUrl}
              className="tile-3d group block"
              aria-label={b.title ? `${b.title} — open` : "Open poster link"}
            >
              {inner}
            </Link>
          ) : (
            <div key={b.id} className="tile-3d">
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
