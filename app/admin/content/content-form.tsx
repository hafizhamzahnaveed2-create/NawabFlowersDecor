"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { MediaUrlField } from "@/components/admin/media-url-field";

type FieldName = "title" | "body" | "imageUrl" | "linkUrl" | "videoUrl";

const fieldLabels: Record<FieldName, string> = {
  title: "Headline",
  body: "Supporting line",
  imageUrl: "Photo",
  videoUrl: "Video (optional)",
  linkUrl: "Click link (Build your own button / hero CTA)",
};

const barLabels: Partial<Record<FieldName, string>> = {
  title: "Announcement message",
  linkUrl: "Click link (optional)",
};

const tickerLabels: Partial<Record<FieldName, string>> = {
  title: "Ticker message",
  linkUrl: "Click link (optional — whole bar is clickable)",
};

type LegacyBlockKey = "home.hero" | "announcement.main" | "announcement.ticker";

export function ContentBlockForm({
  blockKey,
  heading,
  description,
  fields,
  initial,
}: {
  blockKey: LegacyBlockKey;
  heading: string;
  description: string;
  fields: FieldName[];
  initial: {
    title: string;
    body: string;
    imageUrl: string;
    videoUrl: string;
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
          videoUrl: String(form.get("videoUrl") ?? ""),
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

  const labels = {
    ...fieldLabels,
    ...(blockKey === "announcement.main" ? barLabels : {}),
    ...(blockKey === "announcement.ticker" ? tickerLabels : {}),
  };

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
        {fields.map((field) => {
          if (field === "imageUrl") {
            return (
              <MediaUrlField
                key={field}
                id={`${blockKey}-${field}`}
                name="imageUrl"
                label={labels.imageUrl}
                defaultValue={initial.imageUrl}
                folder="content"
                kind="image"
                hint="Paste a URL or upload from your device. Video below takes priority on the homepage when set."
              />
            );
          }
          if (field === "videoUrl") {
            return (
              <MediaUrlField
                key={field}
                id={`${blockKey}-${field}`}
                name="videoUrl"
                label={labels.videoUrl}
                defaultValue={initial.videoUrl}
                folder="content/videos"
                kind="video"
                hint="MP4 or WebM under 40 MB, or a direct video URL. Plays on the homepage hero."
              />
            );
          }
          return (
            <div key={field}>
              <Label htmlFor={`${blockKey}-${field}`}>
                {labels[field]}
              </Label>
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
          );
        })}
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={initial.isPublished}
            className="size-4 accent-burgundy"
          />
          <span>
            {blockKey === "announcement.main" ||
            blockKey === "announcement.ticker"
              ? "Enable on the shop"
              : "Show on the site"}
          </span>
        </label>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save"}
        </Button>
        {message && <p className="mt-0 text-sm text-sage">{message}</p>}
        {error && (
          <p role="alert" className="text-sm text-burgundy">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
