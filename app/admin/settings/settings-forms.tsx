"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

const PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "whatsapp",
] as const;

type Social = {
  id: string;
  platform: string;
  url: string;
  sortOrder: number;
  isEnabled: boolean;
};

export function SettingsForms({
  whatsapp,
  socials,
}: {
  whatsapp: string | null;
  socials: Social[];
}) {
  const router = useRouter();
  const [waError, setWaError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  const saveWa = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "whatsapp",
          number: String(form.get("number") ?? ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
    },
    onSuccess: () => {
      setWaError(null);
      router.refresh();
    },
    onError: (e: Error) => setWaError(e.message),
  });

  const saveSocial = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "social",
          platform: String(form.get("platform") ?? ""),
          url: String(form.get("url") ?? ""),
          sortOrder: Number(form.get("sortOrder") ?? 0),
          isEnabled: form.get("isEnabled") === "on",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
    },
    onSuccess: () => {
      setSocialError(null);
      router.refresh();
    },
    onError: (e: Error) => setSocialError(e.message),
  });

  async function remove(id: string) {
    if (!confirm("Remove this social link?")) return;
    await fetch(`/api/admin/settings?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        className="rounded-petal border border-stone bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveWa.mutate(new FormData(e.currentTarget));
        }}
      >
        <h2 className="font-display text-xl text-burgundy">WhatsApp</h2>
        <p className="mt-1 text-sm text-ink/60">
          Digits only with country code — used by the floating chat button
          (wa.me).
        </p>
        <div className="mt-4 max-w-sm">
          <Label htmlFor="number">Phone number</Label>
          <Input
            id="number"
            name="number"
            required
            defaultValue={whatsapp ?? ""}
            placeholder="923001234567"
          />
        </div>
        <FieldError message={waError ?? undefined} />
        <Button type="submit" className="mt-4" disabled={saveWa.isPending}>
          {saveWa.isPending ? "Saving…" : "Save WhatsApp"}
        </Button>
      </form>

      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">Social links</h2>
        <p className="mt-1 text-sm text-ink/60">
          Only enabled links appear in the footer. Leave disabled until the
          account is live.
        </p>

        <ul className="mt-4 divide-y divide-stone border-t border-stone">
          {socials.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <span className="font-medium capitalize">{s.platform}</span>
                <span className="ml-2 text-ink/50">{s.url}</span>
                {!s.isEnabled && (
                  <span className="ml-2 text-xs text-ink/40">off</span>
                )}
              </div>
              <button
                type="button"
                className="text-xs text-ink/40 hover:text-burgundy"
                onClick={() => remove(s.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <form
          className="mt-5 space-y-3 border-t border-stone pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveSocial.mutate(new FormData(e.currentTarget));
            e.currentTarget.reset();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <select
                id="platform"
                name="platform"
                className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
                defaultValue="instagram"
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                required
                placeholder="https://instagram.com/…"
              />
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isEnabled"
              className="accent-burgundy"
            />
            Enabled (show on storefront)
          </label>
          <FieldError message={socialError ?? undefined} />
          <Button type="submit" disabled={saveSocial.isPending}>
            {saveSocial.isPending ? "Saving…" : "Save social link"}
          </Button>
        </form>
      </section>
    </div>
  );
}
