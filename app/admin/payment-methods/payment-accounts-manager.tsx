"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";

type Account = {
  id: string;
  name: string;
  slug: string;
  accountTitle: string;
  accountNumber: string;
  iconKey: string;
  instructions: string | null;
  sortOrder: number;
  isActive: boolean;
};

export function PaymentAccountsManager({
  initial,
}: {
  initial: Account[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const body = {
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
        accountTitle: String(form.get("accountTitle") ?? ""),
        accountNumber: String(form.get("accountNumber") ?? ""),
        iconKey: String(form.get("iconKey") ?? "bank"),
        instructions: String(form.get("instructions") ?? ""),
        sortOrder: Number(form.get("sortOrder") ?? 0),
        isActive: form.get("isActive") === "on",
      };
      const res = await fetch(
        editing
          ? `/api/admin/payment-accounts/${editing.id}`
          : "/api/admin/payment-accounts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save");
    },
    onSuccess: () => {
      setError(null);
      setEditing(null);
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  async function remove(id: string) {
    if (!confirm("Delete this payment method?")) return;
    await fetch(`/api/admin/payment-accounts/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-stone rounded-petal border border-stone bg-white">
        {initial.length === 0 ? (
          <li className="px-4 py-8 text-center text-ink/50">
            No payment accounts yet.
          </li>
        ) : (
          initial.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {a.name}{" "}
                  <span className="text-ink/40">({a.slug})</span>
                </p>
                <p className="text-ink/60">
                  {a.accountTitle} · {a.accountNumber}
                </p>
                {!a.isActive && (
                  <span className="text-xs text-ink/40">Inactive</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-sage hover:text-burgundy"
                  onClick={() => setEditing(a)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-ink/40 hover:text-burgundy"
                  onClick={() => remove(a.id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <form
        key={editing?.id ?? "new"}
        className="rounded-petal border border-stone bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          save.mutate(new FormData(e.currentTarget));
        }}
      >
        <h2 className="font-display text-xl text-burgundy">
          {editing ? `Edit ${editing.name}` : "Add payment method"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={editing?.name ?? ""}
              placeholder="JazzCash"
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              name="slug"
              required
              defaultValue={editing?.slug ?? ""}
              placeholder="jazzcash"
            />
          </div>
          <div>
            <Label htmlFor="accountTitle">Account title</Label>
            <Input
              id="accountTitle"
              name="accountTitle"
              required
              defaultValue={editing?.accountTitle ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="accountNumber">Account / IBAN / mobile</Label>
            <Input
              id="accountNumber"
              name="accountNumber"
              required
              defaultValue={editing?.accountNumber ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="iconKey">Icon</Label>
            <select
              id="iconKey"
              name="iconKey"
              defaultValue={editing?.iconKey ?? "bank"}
              className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
            >
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="bank">Bank transfer</option>
              <option value="card">Card networks</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sortOrder">Sort order</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={editing?.sortOrder ?? 0}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="instructions">Instructions (optional)</Label>
            <Textarea
              id="instructions"
              name="instructions"
              rows={2}
              defaultValue={editing?.instructions ?? ""}
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={editing?.isActive ?? true}
            className="accent-burgundy"
          />
          Active on checkout
        </label>
        <FieldError message={error ?? undefined} />
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : editing ? "Update" : "Create"}
          </Button>
          {editing && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
