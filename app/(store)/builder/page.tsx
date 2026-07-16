import type { Metadata } from "next";
import { listActiveBuilderComponents } from "@/lib/repositories/builder";
import { BouquetBuilder } from "@/components/builder/bouquet-builder";

export const metadata: Metadata = {
  title: "Build your own bouquet",
  description:
    "Compose a custom bouquet — choose stems, greenery, wrap, ribbon, and a vase, with a live preview and price.",
};

export const revalidate = 60;

export default async function BuilderPage() {
  const components = await listActiveBuilderComponents();

  if (components.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl text-burgundy">
          Build your own bouquet
        </h1>
        <p className="mt-4 text-ink/70">
          The builder is being stocked. Check back shortly, or browse our
          ready-made bouquets in the meantime.
        </p>
      </div>
    );
  }

  return <BouquetBuilder components={components} />;
}
