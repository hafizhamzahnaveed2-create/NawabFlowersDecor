"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { KNOWN_SOCIAL_PLATFORMS } from "@/lib/validation/settings";
import { slugify } from "@/lib/slug";

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
  maintenance,
  features,
}: {
  whatsapp: string | null;
  socials: Social[];
  maintenance: { enabled: boolean; message: string };
  features: { builder: boolean; reviews: boolean; newsletter: boolean };
}) {
  const router = useRouter();
  const [waError, setWaError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [featuresError, setFeaturesError] = useState<string | null>(null);
  const [platformChoice, setPlatformChoice] = useState<string>("instagram");

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
      const choice = String(form.get("platformChoice") ?? "instagram");
      const custom = String(form.get("customPlatform") ?? "");
      const platform =
        choice === "other" ? slugify(custom) : choice;
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "social",
          platform,
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
      setPlatformChoice("instagram");
      router.refresh();
    },
    onError: (e: Error) => setSocialError(e.message),
  });

  const saveMaintenance = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "maintenance",
          enabled: form.get("enabled") === "on",
          message: String(form.get("message") ?? ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
    },
    onSuccess: () => {
      setMaintenanceError(null);
      router.refresh();
    },
    onError: (e: Error) => setMaintenanceError(e.message),
  });

  const saveFeatures = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "features",
          builder: form.get("builder") === "on",
          reviews: form.get("reviews") === "on",
          newsletter: form.get("newsletter") === "on",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
    },
    onSuccess: () => {
      setFeaturesError(null);
      router.refresh();
    },
    onError: (e: Error) => setFeaturesError(e.message),
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
          Instagram, Facebook, TikTok, and more — or add any other network with
          “Other”. Only enabled links appear in the footer.
        </p>

        <ul className="mt-4 divide-y divide-stone border-t border-stone">
          {socials.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <span className="font-medium capitalize">
                  {s.platform.replace(/-/g, " ")}
                </span>
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
            setPlatformChoice("instagram");
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="platformChoice">Platform</Label>
              <select
                id="platformChoice"
                name="platformChoice"
                className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
                value={platformChoice}
                onChange={(e) => setPlatformChoice(e.target.value)}
              >
                {KNOWN_SOCIAL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p === "x" ? "X (Twitter)" : p}
                  </option>
                ))}
                <option value="other">Other (custom name)</option>
              </select>
            </div>
            {platformChoice === "other" && (
              <div>
                <Label htmlFor="customPlatform">Custom platform name</Label>
                <Input
                  id="customPlatform"
                  name="customPlatform"
                  required
                  placeholder="e.g. threads or snapchat"
                />
              </div>
            )}
            <div className={platformChoice === "other" ? "sm:col-span-2" : ""}>
              <Label htmlFor="url">Profile URL</Label>
              <Input
                id="url"
                name="url"
                type="url"
                required
                placeholder="https://…"
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

      <form
        className="rounded-petal border border-stone bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveMaintenance.mutate(new FormData(e.currentTarget));
        }}
      >
        <h2 className="font-display text-xl text-burgundy">Maintenance mode</h2>
        <p className="mt-1 text-sm text-ink/60">
          Pause the storefront while you refresh arrangements or update
          inventory. Shoppers see your message instead of the catalog.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={maintenance.enabled}
            className="accent-burgundy"
          />
          Maintenance mode on
        </label>
        <div className="mt-3">
          <Label htmlFor="maintenance-message">Message</Label>
          <Textarea
            id="maintenance-message"
            name="message"
            rows={3}
            required
            defaultValue={maintenance.message}
            placeholder="We're preparing today's stems — back shortly."
          />
        </div>
        <FieldError message={maintenanceError ?? undefined} />
        <Button type="submit" className="mt-4" disabled={saveMaintenance.isPending}>
          {saveMaintenance.isPending ? "Saving…" : "Save maintenance"}
        </Button>
      </form>

      <form
        className="rounded-petal border border-stone bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveFeatures.mutate(new FormData(e.currentTarget));
        }}
      >
        <h2 className="font-display text-xl text-burgundy">Storefront features</h2>
        <p className="mt-1 text-sm text-ink/60">
          Turn optional experiences on or off without a code deploy.
        </p>
        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="builder"
              defaultChecked={features.builder}
              className="accent-burgundy"
            />
            Custom bouquet builder
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="reviews"
              defaultChecked={features.reviews}
              className="accent-burgundy"
            />
            Product reviews
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="newsletter"
              defaultChecked={features.newsletter}
              className="accent-burgundy"
            />
            Newsletter signup
          </label>
        </div>
        <FieldError message={featuresError ?? undefined} />
        <Button type="submit" className="mt-4" disabled={saveFeatures.isPending}>
          {saveFeatures.isPending ? "Saving…" : "Save features"}
        </Button>
      </form>
    </div>
  );
}
