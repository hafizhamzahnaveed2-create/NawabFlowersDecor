import Image from "next/image";
import Link from "next/link";
import type { ContentBlockDto } from "@/lib/repositories/content";

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
            <div className="relative overflow-hidden rounded-petal bg-stone/40 shadow-bloom transition-[transform,box-shadow] duration-300 ease-out group-hover:-translate-y-0.5 group-hover:shadow-bloom-lg motion-reduce:transition-none motion-reduce:group-hover:translate-y-0">
              {b.imageUrl ? (
                <div className="relative aspect-[21/9]">
                  <Image
                    src={b.imageUrl}
                    alt={b.title ?? ""}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized={!b.imageUrl.includes("images.unsplash.com")}
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
                      <span className="mt-4 inline-flex w-fit rounded-lg bg-ivory/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-burgundy">
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
              className="group block"
              aria-label={b.title ? `${b.title} — open` : "Open poster link"}
            >
              {inner}
            </Link>
          ) : (
            <div key={b.id}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
