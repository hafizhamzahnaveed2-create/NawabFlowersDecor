"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { formatPrice } from "@/lib/money";

type Zone = {
  id: string;
  name: string;
  city: string;
  area: string | null;
  fee: number;
  sortOrder: number;
  isActive: boolean;
};

type TaxRule = {
  id: string;
  name: string;
  ratePercent: number;
  city: string | null;
  isActive: boolean;
};

export function ShippingManager({
  initialZones,
  initialTaxRules,
  schedule,
}: {
  initialZones: Zone[];
  initialTaxRules: TaxRule[];
  schedule: {
    sameDayDelivery: boolean;
    maxLeadDays: number;
  };
}) {
  const router = useRouter();
  const [zoneError, setZoneError] = useState<string | null>(null);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingTax, setEditingTax] = useState<TaxRule | null>(null);

  const saveSchedule = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "deliverySchedule",
          sameDayDelivery: form.get("sameDayDelivery") === "on",
          maxLeadDays: Number(form.get("maxLeadDays") ?? 30),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save schedule");
    },
    onSuccess: () => {
      setScheduleError(null);
      router.refresh();
    },
    onError: (e: Error) => setScheduleError(e.message),
  });

  const saveZone = useMutation({
    mutationFn: async (form: FormData) => {
      const body = {
        kind: "zone",
        name: String(form.get("name") ?? ""),
        city: String(form.get("city") ?? ""),
        area: String(form.get("area") ?? ""),
        fee: Number(form.get("fee") ?? 0),
        sortOrder: Number(form.get("sortOrder") ?? 0),
        isActive: form.get("isActive") === "on",
      };
      const res = await fetch(
        editingZone
          ? `/api/admin/shipping/${editingZone.id}`
          : "/api/admin/shipping",
        {
          method: editingZone ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save zone");
    },
    onSuccess: () => {
      setZoneError(null);
      setEditingZone(null);
      router.refresh();
    },
    onError: (e: Error) => setZoneError(e.message),
  });

  const saveTax = useMutation({
    mutationFn: async (form: FormData) => {
      const body = {
        kind: "tax",
        name: String(form.get("name") ?? ""),
        ratePercent: Number(form.get("ratePercent") ?? 0),
        city: String(form.get("city") ?? ""),
        isActive: form.get("isActive") === "on",
      };
      const res = await fetch(
        editingTax
          ? `/api/admin/shipping/${editingTax.id}`
          : "/api/admin/shipping",
        {
          method: editingTax ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save tax rule");
    },
    onSuccess: () => {
      setTaxError(null);
      setEditingTax(null);
      router.refresh();
    },
    onError: (e: Error) => setTaxError(e.message),
  });

  async function removeZone(id: string) {
    if (!confirm("Remove this delivery zone?")) return;
    await fetch(`/api/admin/shipping/${id}?kind=zone`, { method: "DELETE" });
    router.refresh();
  }

  async function removeTax(id: string) {
    if (!confirm("Remove this tax rule?")) return;
    await fetch(`/api/admin/shipping/${id}?kind=tax`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <form
        className="rounded-petal border border-stone bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveSchedule.mutate(new FormData(e.currentTarget));
        }}
      >
        <h2 className="font-display text-xl text-burgundy">
          Delivery date rules
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Control the earliest and latest dates shoppers can choose at checkout.
          Turn same-day off if you need a preparation buffer.
        </p>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sameDayDelivery"
            defaultChecked={schedule.sameDayDelivery}
            className="accent-burgundy"
          />
          Allow same-day delivery
        </label>
        <div className="mt-3 max-w-xs">
          <Label htmlFor="maxLeadDays">Book up to (days ahead)</Label>
          <Input
            id="maxLeadDays"
            name="maxLeadDays"
            type="number"
            min={1}
            max={90}
            required
            defaultValue={schedule.maxLeadDays}
          />
        </div>
        <FieldError message={scheduleError ?? undefined} />
        <Button
          type="submit"
          className="mt-4"
          disabled={saveSchedule.isPending}
        >
          {saveSchedule.isPending ? "Saving…" : "Save date rules"}
        </Button>
      </form>

      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">Delivery zones</h2>
        <p className="mt-1 text-sm text-ink/60">
          City-wide zones use a blank neighbourhood. Area-specific zones override
          the city rate.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-stone">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
                <th className="px-3 py-2">Zone</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Area</th>
                <th className="px-3 py-2">Fee</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {initialZones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-ink/50">
                    No zones yet — add one below.
                  </td>
                </tr>
              ) : (
                initialZones.map((z) => (
                  <tr key={z.id} className="hover:bg-ivory/60">
                    <td className="px-3 py-2 font-medium">{z.name}</td>
                    <td className="px-3 py-2">{z.city}</td>
                    <td className="px-3 py-2">{z.area ?? "—"}</td>
                    <td className="px-3 py-2">{formatPrice(z.fee)}</td>
                    <td className="px-3 py-2">
                      {z.isActive ? (
                        <span className="text-sage">Active</span>
                      ) : (
                        <span className="text-ink/40">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="mr-2 text-xs text-sage hover:text-burgundy"
                        onClick={() => setEditingZone(z)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-ink/40 hover:text-burgundy"
                        onClick={() => removeZone(z.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form
          key={editingZone?.id ?? "zone-new"}
          className="mt-5 space-y-3 border-t border-stone pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveZone.mutate(new FormData(e.currentTarget));
          }}
        >
          <h3 className="font-display text-lg text-burgundy">
            {editingZone ? `Edit ${editingZone.name}` : "Add delivery zone"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="zone-name">Name</Label>
              <Input
                id="zone-name"
                name="name"
                required
                defaultValue={editingZone?.name ?? ""}
                placeholder="Lahore — DHA"
              />
            </div>
            <div>
              <Label htmlFor="zone-city">City</Label>
              <Input
                id="zone-city"
                name="city"
                required
                defaultValue={editingZone?.city ?? ""}
                placeholder="Lahore"
              />
            </div>
            <div>
              <Label htmlFor="zone-area">Neighbourhood (optional)</Label>
              <Input
                id="zone-area"
                name="area"
                defaultValue={editingZone?.area ?? ""}
                placeholder="DHA"
              />
            </div>
            <div>
              <Label htmlFor="zone-fee">Delivery fee (PKR)</Label>
              <Input
                id="zone-fee"
                name="fee"
                type="number"
                min={0}
                required
                defaultValue={editingZone?.fee ?? 250}
              />
            </div>
            <div>
              <Label htmlFor="zone-sort">Sort order</Label>
              <Input
                id="zone-sort"
                name="sortOrder"
                type="number"
                min={0}
                defaultValue={editingZone?.sortOrder ?? 0}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={editingZone?.isActive ?? true}
              className="accent-burgundy"
            />
            Active at checkout
          </label>
          <FieldError message={zoneError ?? undefined} />
          <div className="flex gap-2">
            <Button type="submit" disabled={saveZone.isPending}>
              {saveZone.isPending ? "Saving…" : editingZone ? "Update zone" : "Add zone"}
            </Button>
            {editingZone && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingZone(null)}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">Tax rules</h2>
        <p className="mt-1 text-sm text-ink/60">
          City-specific rules override the global rate. Tax applies to subtotal
          minus discounts.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-stone">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left text-xs uppercase tracking-wider text-ink/50">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Rate</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {initialTaxRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink/50">
                    No tax rules yet — add one below.
                  </td>
                </tr>
              ) : (
                initialTaxRules.map((r) => (
                  <tr key={r.id} className="hover:bg-ivory/60">
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2">{r.ratePercent}%</td>
                    <td className="px-3 py-2">{r.city ?? "All cities"}</td>
                    <td className="px-3 py-2">
                      {r.isActive ? (
                        <span className="text-sage">Active</span>
                      ) : (
                        <span className="text-ink/40">Inactive</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="mr-2 text-xs text-sage hover:text-burgundy"
                        onClick={() => setEditingTax(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs text-ink/40 hover:text-burgundy"
                        onClick={() => removeTax(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form
          key={editingTax?.id ?? "tax-new"}
          className="mt-5 space-y-3 border-t border-stone pt-5"
          onSubmit={(e) => {
            e.preventDefault();
            saveTax.mutate(new FormData(e.currentTarget));
          }}
        >
          <h3 className="font-display text-lg text-burgundy">
            {editingTax ? `Edit ${editingTax.name}` : "Add tax rule"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="tax-name">Name</Label>
              <Input
                id="tax-name"
                name="name"
                required
                defaultValue={editingTax?.name ?? ""}
                placeholder="Sales tax"
              />
            </div>
            <div>
              <Label htmlFor="tax-rate">Rate (%)</Label>
              <Input
                id="tax-rate"
                name="ratePercent"
                type="number"
                min={0}
                max={100}
                step={0.01}
                required
                defaultValue={editingTax?.ratePercent ?? 5}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="tax-city">City (blank = all cities)</Label>
              <Input
                id="tax-city"
                name="city"
                defaultValue={editingTax?.city ?? ""}
                placeholder="Lahore"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={editingTax?.isActive ?? true}
              className="accent-burgundy"
            />
            Active at checkout
          </label>
          <FieldError message={taxError ?? undefined} />
          <div className="flex gap-2">
            <Button type="submit" disabled={saveTax.isPending}>
              {saveTax.isPending ? "Saving…" : editingTax ? "Update rule" : "Add rule"}
            </Button>
            {editingTax && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingTax(null)}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
