"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

export function CouponCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: async (form: FormData) => {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: String(form.get("code") ?? ""),
          kind: String(form.get("kind") ?? "PERCENT"),
          value: Number(form.get("value")),
          minOrderAmount: form.get("minOrderAmount")
            ? Number(form.get("minOrderAmount"))
            : null,
          maxRedemptions: form.get("maxRedemptions")
            ? Number(form.get("maxRedemptions"))
            : null,
          isActive: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not create coupon");
    },
    onSuccess: () => {
      setError(null);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        create.mutate(new FormData(e.currentTarget));
        e.currentTarget.reset();
      }}
      className="mt-6 rounded-petal border border-stone bg-white p-6"
    >
      <h2 className="font-display text-xl text-burgundy">New coupon</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" required placeholder="WELCOME10" />
        </div>
        <div>
          <Label htmlFor="kind">Type</Label>
          <select
            id="kind"
            name="kind"
            className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
            defaultValue="PERCENT"
          >
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount</option>
          </select>
        </div>
        <div>
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            name="value"
            type="number"
            min={1}
            step={1}
            required
            placeholder="10"
          />
        </div>
        <div>
          <Label htmlFor="minOrderAmount">Min order (optional)</Label>
          <Input
            id="minOrderAmount"
            name="minOrderAmount"
            type="number"
            min={0}
            step={1}
            placeholder="2000"
          />
        </div>
        <div>
          <Label htmlFor="maxRedemptions">Max uses (optional)</Label>
          <Input
            id="maxRedemptions"
            name="maxRedemptions"
            type="number"
            min={1}
            step={1}
            placeholder="100"
          />
        </div>
      </div>
      <FieldError message={error ?? undefined} />
      <Button type="submit" className="mt-4" disabled={create.isPending}>
        {create.isPending ? "Saving…" : "Create coupon"}
      </Button>
    </form>
  );
}
