"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";

type FieldName = "title" | "body" | "imageUrl" | "linkUrl";

const fieldLabels: Record<FieldName, string> = {
  title: "Headline",
  body: "Supporting line",
  imageUrl: "Photo URL",
  linkUrl: "Link (where clicking goes, optional)",
};

export function ContentBlockForm({
  blockKey,
  heading,
  description,
  fields,
  initial,
}: {
  blockKey: "home.hero" | "announcement.main";
  heading: string;
  description: string;
  fields: FieldName[];
  initial: {
    title: string;
    body: string;
    imageUrl: string;
    linkUrl: string;
    isPublished: boolean;
  };
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: blockKey,
          title: String(form.get("title") ?? ""),
          body: String(form.get("body") ?? ""),
          imageUrl: String(form.get("imageUrl") ?? ""),
          linkUrl: String(form.get("linkUrl") ?? ""),
          isPublished: form.get("isPublished") === "on",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save");
      }
    },
    onSuccess: () => {
      setMessage("Saved — it's live now.");
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        setError(null);
        save.mutate(new FormData(e.currentTarget));
      }}
      className="mt-6 rounded-petal border border-stone bg-white p-6"
    >
      <h2 className="font-display text-xl text-burgundy">{heading}</h2>
      <p className="mt-1 text-sm text-ink/60">{description}</p>

      <div className="mt-4 space-y-4">
        {fields.map((field) => (
          <div key={field}>
            <Label htmlFor={`${blockKey}-${field}`}>{fieldLabels[field]}</Label>
            {field === "body" ? (
              <Textarea
                id={`${blockKey}-${field}`}
                name={field}
                rows={2}
                defaultValue={initial[field]}
              />
            ) : (
              <Input
                id={`${blockKey}-${field}`}
                name={field}
                defaultValue={initial[field]}
              />
            )}
          </div>
        ))}
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={initial.isPublished}
            className="size-4 accent-burgundy"
          />
          <span>Show on the site</span>
        </label>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
        {message && <p className="text-sm text-sage">{message}</p>}
        {error && (
          <p role="alert" className="text-sm text-burgundy">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
