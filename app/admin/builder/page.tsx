import Link from "next/link";
import { listAdminBuilderComponents } from "@/lib/repositories/builder";
import { formatPrice } from "@/lib/money";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Builder · Admin" };

const KIND_ORDER = ["STEM", "GREENERY", "WRAP", "RIBBON", "VASE", "CARD"];

export default async function AdminBuilderPage() {
  const components = await listAdminBuilderComponents();
  const grouped = KIND_ORDER.map((kind) => ({
    kind,
    items: components.filter((c) => c.kind === kind),
  })).filter((g) => g.items.length > 0 || true);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-burgundy">
            Bouquet builder
          </h1>
          <p className="mt-1 text-ink/60">
            Components customers can pick when building their own bouquet.
            Link them to raw-material products so stock stays in sync.
          </p>
        </div>
        <Link
          href="/admin/builder/new"
          className="rounded-lg bg-burgundy px-4 py-2.5 font-medium text-ivory transition-colors hover:bg-burgundy-deep"
        >
          Add component
        </Link>
      </div>

      {components.length === 0 ? (
        <div className="mt-8 rounded-petal border border-stone bg-white p-12 text-center">
          <p className="font-display text-2xl text-burgundy">
            No builder components yet
          </p>
          <p className="mt-2 text-ink/60">
            Add stems, greenery, wraps, ribbons, and vases to stock the builder.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          {grouped.map(({ kind, items }) => (
            <section key={kind}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-sage">
                {kind}
              </h2>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-ink/50">None yet</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone overflow-hidden rounded-petal border border-stone bg-white">
                  {items.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/builder/${c.id}`}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-ivory/60"
                      >
                        <span className="relative block h-12 w-10 shrink-0 overflow-hidden rounded bg-stone/40">
                          {c.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={c.imageUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-sm text-ink/60">
                            {formatPrice(c.unitPrice)} · stock {c.stock}
                            {c.productName ? ` · linked: ${c.productName}` : ""}
                          </p>
                        </div>
                        {!c.isActive && <Badge variant="muted">Hidden</Badge>}
                        {c.stock <= 5 && c.isActive && (
                          <Badge variant="sale">Low stock</Badge>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
