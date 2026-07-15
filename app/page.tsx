const palette = [
  { name: "Ivory", hex: "#FAF7F1", className: "bg-ivory border border-stone" },
  { name: "Blush", hex: "#E7B8B4", className: "bg-blush" },
  { name: "Sage", hex: "#7D8B6A", className: "bg-sage" },
  { name: "Burgundy", hex: "#582B35", className: "bg-burgundy" },
  { name: "Ink", hex: "#2B2724", className: "bg-ink" },
  { name: "Stone", hex: "#EAE3D8", className: "bg-stone" },
];

// Phase 1 foundation page: proves tokens, type, and palette are wired up.
// Replaced by the real storefront home in Phase 2.
export default function Home() {
  return (
    <main className="flex-1 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.25em] text-sage">
          Phase 1 — Foundation
        </p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl text-burgundy">
          Nawab Flowers Decorr
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">
          Fresh stems, hand-tied bouquets, and build-your-own arrangements.
          This page exists only to verify the design foundation — palette,
          typography, and tokens — before the storefront is built in Phase 2.
        </p>

        <section className="mt-14">
          <h2 className="font-display text-2xl text-ink">Palette</h2>
          <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {palette.map((swatch) => (
              <li
                key={swatch.name}
                className="overflow-hidden rounded-petal bg-white shadow-bloom"
              >
                <div className={`h-20 ${swatch.className}`} />
                <div className="px-4 py-3">
                  <p className="font-medium">{swatch.name}</p>
                  <p className="text-sm text-ink/60">{swatch.hex}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl text-ink">Typography</h2>
          <div className="mt-5 rounded-petal bg-white p-8 shadow-bloom">
            <p className="font-display text-4xl text-burgundy">
              Fraunces — display
            </p>
            <p className="mt-3 text-lg text-ink/80">
              Karla — body. Warm, readable, and unfussy, so the flowers stay
              the loudest thing on the page.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
