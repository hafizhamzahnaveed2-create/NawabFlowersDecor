"use client";

import { useState } from "react";
import { Input, Label } from "@/components/ui/field";

type MediaKind = "image" | "video";

export function MediaUrlField({
  id,
  name,
  label,
  defaultValue = "",
  folder,
  kind = "image",
  hint,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  folder: string;
  kind?: MediaKind;
  hint?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    const file = fileList[0];
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("folder", folder);
      fd.set("kind", kind);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not upload that file");
      }
      setUrl(String(data.url ?? ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const accept =
    kind === "video"
      ? "video/mp4,video/webm,video/quicktime"
      : "image/jpeg,image/png,image/webp,image/gif";

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          id={id}
          name={name}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={
            kind === "video"
              ? "https://… or upload a clip"
              : "https://… or upload a photo"
          }
          className="mt-0 sm:flex-1"
        />
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-stone bg-white px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:border-sage hover:text-burgundy">
          {uploading
            ? "Uploading…"
            : kind === "video"
              ? "Upload video"
              : "Upload image"}
          <input
            type="file"
            accept={accept}
            disabled={uploading}
            className="sr-only"
            onChange={(e) => {
              void handleUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-sm text-burgundy">
          {error}
        </p>
      )}
      {url && kind === "image" && (
        <span className="mt-2 block h-20 w-28 overflow-hidden rounded-lg border border-stone bg-stone/20">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of arbitrary URL */}
          <img src={url} alt="" className="h-full w-full object-cover" />
        </span>
      )}
      {url && kind === "video" && /\.(mp4|webm|mov)(\?|$)/i.test(url) && (
        <video
          src={url}
          className="mt-2 h-28 max-w-xs rounded-lg border border-stone bg-ink/5 object-cover"
          muted
          playsInline
          controls
        />
      )}
    </div>
  );
}
