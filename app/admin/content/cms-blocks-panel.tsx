"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import type { ContentBlockKindInput } from "@/lib/validation/cms";

type BlockRow = {
  id: string;
  kind: string;
  key: string;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  data: Record<string, unknown> | null;
  sortOrder: number;
  isPublished: boolean;
};

const kindHints: Record<
  ContentBlockKindInput,
  { title: string; keyHint: string; fields: ("title" | "body" | "imageUrl" | "linkUrl")[] }
> = {
  HERO_SLIDE: {
    title: "Extra hero slides",
    keyHint: "home.hero.2",
    fields: ["title", "body", "imageUrl", "linkUrl"],
  },
  BANNER: {
    title: "Banners & popup",
    keyHint: "banner.spring or popup.main",
    fields: ["title", "body", "imageUrl", "linkUrl"],
  },
  FAQ: {
    title: "FAQs",
    keyHint: "faq.delivery",
    fields: ["title", "body"],
  },
  POLICY: {
    title: "Policies",
    keyHint: "policy.shipping",
    fields: ["title", "body"],
  },
  SECTION: {
    title: "Blog posts",
    keyHint: "blog.spring-roses",
    fields: ["title", "body", "imageUrl"],
  },
  ANNOUNCEMENT: {
    title: "Announcements",
    keyHint: "announcement.extra",
    fields: ["title", "linkUrl"],
  },
  TESTIMONIAL: {
    title: "Testimonials",
    keyHint: "testimonial.1",
    fields: ["title", "body", "imageUrl"],
  },
};

export function CmsBlocksPanel({
  kind,
  blocks,
}: {
  kind: ContentBlockKindInput;
  blocks: BlockRow[];
}) {
  const router = useRouter();
  const hint = kindHints[kind];
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (payload: {
      id?: string;
      form: FormData;
    }) => {
      const body = {
        kind,
        key: String(payload.form.get("key") ?? ""),
        title: String(payload.form.get("title") ?? ""),
        body: String(payload.form.get("body") ?? ""),
        imageUrl: String(payload.form.get("imageUrl") ?? "") || null,
        linkUrl: String(payload.form.get("linkUrl") ?? "") || null,
        sortOrder: Number(payload.form.get("sortOrder") ?? 0),
        isPublished: payload.form.get("isPublished") === "on",
        data:
          kind === "SECTION"
            ? {
                excerpt: String(payload.form.get("excerpt") ?? ""),
              }
            : kind === "BANNER" &&
                String(payload.form.get("key") ?? "").startsWith("popup.")
              ? { delayMs: 800 }
              : null,
      };
      const res = await fetch(
        payload.id ? `/api/admin/content/${payload.id}` : "/api/admin/content",
        {
          method: payload.id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
    },
    onSuccess: () => {
      setError(null);
      setEditingId(null);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  async function remove(id: string) {
    if (!confirm("Delete this block?")) return;
    const res = await fetch(`/api/admin/content/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  const editing = editingId
    ? blocks.find((b) => b.id === editingId)
    : undefined;

  return (
    <section className="mt-10 rounded-petal border border-stone bg-white p-6">
      <h2 className="font-display text-xl text-burgundy">{hint.title}</h2>
      <p className="mt-1 text-sm text-ink/60">
        Key example: <code className="text-xs">{hint.keyHint}</code>
        {kind === "BANNER" && (
          <>
            {" "}
            — use key <code className="text-xs">popup.main</code> for the
            promotional popup.
          </>
        )}
        {kind === "SECTION" && (
          <> — keys must start with <code className="text-xs">blog.</code></>
        )}
      </p>

      {blocks.length > 0 && (
        <ul className="mt-4 divide-y divide-stone border-t border-stone">
          {blocks.map((b) => (
            <li
              key={b.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{b.title || b.key}</span>
                <span className="ml-2 text-ink/40">{b.key}</span>
                {!b.isPublished && (
                  <span className="ml-2 text-xs text-ink/40">draft</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-sage hover:text-burgundy"
                  onClick={() => setEditingId(b.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-ink/40 hover:text-burgundy"
                  onClick={() => remove(b.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        key={editing?.id ?? "new"}
        className="mt-5 space-y-3 border-t border-stone pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          save.mutate({
            id: editing?.id,
            form: new FormData(e.currentTarget),
          });
        }}
      >
        <p className="text-sm font-medium text-ink">
          {editing ? `Editing ${editing.key}` : "Add new"}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${kind}-key`}>Key</Label>
            <Input
              id={`${kind}-key`}
              name="key"
              required
              defaultValue={editing?.key ?? ""}
              placeholder={hint.keyHint}
            />
          </div>
          <div>
            <Label htmlFor={`${kind}-sort`}>Sort order</Label>
            <Input
              id={`${kind}-sort`}
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={editing?.sortOrder ?? 0}
            />
          </div>
        </div>
        {hint.fields.includes("title") && (
          <div>
            <Label htmlFor={`${kind}-title`}>Title</Label>
            <Input
              id={`${kind}-title`}
              name="title"
              defaultValue={editing?.title ?? ""}
            />
          </div>
        )}
        {hint.fields.includes("body") && (
          <div>
            <Label htmlFor={`${kind}-body`}>Body</Label>
            <Textarea
              id={`${kind}-body`}
              name="body"
              rows={kind === "POLICY" || kind === "SECTION" ? 8 : 3}
              defaultValue={editing?.body ?? ""}
            />
          </div>
        )}
        {kind === "SECTION" && (
          <div>
            <Label htmlFor={`${kind}-excerpt`}>Excerpt</Label>
            <Input
              id={`${kind}-excerpt`}
              name="excerpt"
              defaultValue={
                typeof editing?.data?.excerpt === "string"
                  ? editing.data.excerpt
                  : ""
              }
            />
          </div>
        )}
        {hint.fields.includes("imageUrl") && (
          <div>
            <Label htmlFor={`${kind}-image`}>Image URL</Label>
            <Input
              id={`${kind}-image`}
              name="imageUrl"
              type="url"
              defaultValue={editing?.imageUrl ?? ""}
            />
          </div>
        )}
        {hint.fields.includes("linkUrl") && (
          <div>
            <Label htmlFor={`${kind}-link`}>Link URL</Label>
            <Input
              id={`${kind}-link`}
              name="linkUrl"
              defaultValue={editing?.linkUrl ?? ""}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={editing?.isPublished ?? true}
            className="accent-burgundy"
          />
          Published
        </label>
        <FieldError message={error ?? undefined} />
        <div className="flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : editing ? "Update" : "Create"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingId(null)}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
