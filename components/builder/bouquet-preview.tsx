"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { BuilderComponent } from "@/lib/repositories/builder";
import { formatPrice } from "@/lib/money";
import { selectedItems, runningTotal } from "@/lib/builder/store";
import { canOptimizeImage } from "@/lib/images";

/**
 * The site's signature moment: a live layered preview of the bouquet as
 * the customer builds it. Layers stack vase → greenery → stems → wrap → ribbon.
 */
export function BouquetPreview({
  selections,
  components,
}: {
  selections: Record<string, number>;
  components: BuilderComponent[];
}) {
  const reduced = useReducedMotion();
  const items = selectedItems(selections, components);
  const total = runningTotal(selections, components);

  const ofKind = (kind: string) =>
    items.filter((i) => i.component.kind === kind);

  const vase = ofKind("VASE")[0];
  const greenery = ofKind("GREENERY");
  const stems = ofKind("STEM");
  const wrap = ofKind("WRAP")[0];
  const ribbon = ofKind("RIBBON")[0];

  // Expand stems into visual slots (cap at 8 for the preview).
  const stemSlots: BuilderComponent[] = [];
  for (const { component, quantity } of stems) {
    for (let i = 0; i < quantity && stemSlots.length < 8; i++) {
      stemSlots.push(component);
    }
  }

  const empty = items.length === 0;

  return (
    <div className="flex flex-col">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-petal bg-gradient-to-b from-blush/30 via-ivory to-stone/40 shadow-bloom-lg [perspective:1000px]">
        {/* Soft ambient bloom behind everything */}
        <div
          aria-hidden
          className="preview-float absolute inset-[12%] rounded-full bg-blush/20 blur-xl"
        />

        <AnimatePresence>
          {empty && (
            <motion.p
              key="empty"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center px-8 text-center text-ink/45"
            >
              Your bouquet will appear here as you choose
            </motion.p>
          )}
        </AnimatePresence>

        {/* Vase / box — bottom anchor */}
        <AnimatePresence>
          {vase && (
            <PreviewLayer
              key={`vase-${vase.component.id}`}
              reduced={!!reduced}
              className="absolute bottom-[6%] left-1/2 h-[28%] w-[38%] -translate-x-1/2"
              component={vase.component}
            />
          )}
        </AnimatePresence>

        {/* Greenery — mid band */}
        {greenery.map(({ component }, index) => (
          <PreviewLayer
            key={`green-${component.id}-${index}`}
            reduced={!!reduced}
            className="absolute bottom-[22%] left-1/2 h-[42%] w-[55%] -translate-x-1/2"
            style={{
              transform: `translateX(calc(-50% + ${(index - 0.5) * 12}px))`,
              opacity: 0.85,
            }}
            component={component}
          />
        ))}

        {/* Stems — fan across the centre */}
        {stemSlots.map((component, index) => {
          const n = stemSlots.length;
          const offset = (index - (n - 1) / 2) * 14;
          const rotate = (index - (n - 1) / 2) * 4;
          return (
            <PreviewLayer
              key={`stem-${component.id}-${index}`}
              reduced={!!reduced}
              className="absolute bottom-[28%] left-1/2 h-[48%] w-[36%] -translate-x-1/2"
              style={{
                transform: `translateX(calc(-50% + ${offset}px)) rotate(${rotate}deg)`,
                zIndex: 10 + index,
              }}
              component={component}
            />
          );
        })}

        {/* Wrap — soft overlay near the base of the stems */}
        <AnimatePresence>
          {wrap && (
            <PreviewLayer
              key={`wrap-${wrap.component.id}`}
              reduced={!!reduced}
              className="absolute bottom-[18%] left-1/2 h-[30%] w-[50%] -translate-x-1/2"
              style={{ zIndex: 20, opacity: 0.9 }}
              component={wrap.component}
            />
          )}
        </AnimatePresence>

        {/* Ribbon — accent strip */}
        <AnimatePresence>
          {ribbon && (
            <PreviewLayer
              key={`ribbon-${ribbon.component.id}`}
              reduced={!!reduced}
              className="absolute bottom-[20%] left-1/2 h-[18%] w-[42%] -translate-x-1/2"
              style={{ zIndex: 25 }}
              component={ribbon.component}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-sage">
          Running total
        </p>
        <p className="mt-1 font-display text-3xl text-burgundy">
          {formatPrice(total)}
        </p>
        {items.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-ink/65">
            {items.map(({ component, quantity }) => (
              <li key={component.id}>
                {component.name}
                {quantity > 1 ? ` × ${quantity}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PreviewLayer({
  component,
  className,
  style,
  reduced,
}: {
  component: BuilderComponent;
  className?: string;
  style?: React.CSSProperties;
  reduced: boolean;
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className={className}
      style={style}
    >
      {component.imageUrl ? (
        <div className="relative size-full">
          <Image
            src={component.imageUrl}
            alt=""
            fill
            sizes="200px"
            className="object-contain drop-shadow-md"
            unoptimized={!canOptimizeImage(component.imageUrl)}
          />
        </div>
      ) : (
        <div className="flex size-full items-center justify-center rounded-full bg-blush/40 text-xs text-burgundy">
          {component.name.slice(0, 12)}
        </div>
      )}
    </motion.div>
  );
}
