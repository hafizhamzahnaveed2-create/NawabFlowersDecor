import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedPolicy,
  listPublishedByKind,
} from "@/lib/repositories/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = await getPublishedPolicy(slug);
  return { title: policy?.title ?? "Policy" };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [policy, all] = await Promise.all([
    getPublishedPolicy(slug),
    listPublishedByKind("POLICY"),
  ]);
  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {all.length > 1 && (
        <nav className="mb-6 flex flex-wrap gap-3 text-sm">
          {all.map((p) => {
            const s = p.key.replace(/^policy\./, "");
            return (
              <Link
                key={p.id}
                href={`/policies/${s}`}
                className={
                  s === slug
                    ? "font-medium text-burgundy"
                    : "text-ink/60 hover:text-burgundy"
                }
              >
                {p.title}
              </Link>
            );
          })}
        </nav>
      )}
      <h1 className="font-display text-4xl text-burgundy">
        {policy.title ?? "Policy"}
      </h1>
      {policy.body && (
        <div className="mt-6 whitespace-pre-line leading-relaxed text-ink/80">
          {policy.body}
        </div>
      )}
    </div>
  );
}
