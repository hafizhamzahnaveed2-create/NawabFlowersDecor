"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { BuilderComponent } from "@/lib/repositories/builder";
import { COMPONENT_KINDS } from "@/lib/validation/builder";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";

type Linkable = {
  id: string;
  name: string;
  price: unknown;
  stock: number;
  images: { url: string }[];
};

export function BuilderComponentForm({
  component,
  linkable,
}: {
  component?: BuilderComponent;
  linkable: Linkable[];
}) {
  const router = useRouter();
  const isEdit = !!component;
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const url = isEdit
        ? `/api/admin/builder/${component!.id}`
        : "/api/admin/builder";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      return data.component as BuilderComponent;
    },
    onSuccess: (c) => {
      router.push("/admin/builder");
      router.refresh();
      void c;
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/builder/${component!.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
    },
    onSuccess: () => {
      router.push("/admin/builder");
      router.refresh();
    },
    onError: (e: Error) => setError(e.message),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const fd = new FormData(event.currentTarget);
    save.mutate({
      kind: String(fd.get("kind")),
      name: String(fd.get("name")),
      imageUrl: String(fd.get("imageUrl") ?? ""),
      unitPrice: Number(fd.get("unitPrice")),
      stock: Number(fd.get("stock")),
      minQty: Number(fd.get("minQty") || 0),
      maxQty: Number(fd.get("maxQty") || 50),
      sortOrder: Number(fd.get("sortOrder") || 0),
      isActive: fd.get("isActive") === "on",
      productId: String(fd.get("productId") || "") || null,
    });
  }

  // Include currently linked product in the select options.
  const productOptions = [...linkable];
  if (
    component?.productId &&
    !productOptions.some((p) => p.id === component.productId)
  ) {
    productOptions.unshift({
      id: component.productId,
      name: component.productName ?? "Linked product",
      price: component.unitPrice,
      stock: component.stock,
      images: component.imageUrl ? [{ url: component.imageUrl }] : [],
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-5">
      <div>
        <Label htmlFor="kind">Type</Label>
        <select
          id="kind"
          name="kind"
          defaultValue={component?.kind ?? "STEM"}
          className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
        >
          {COMPONENT_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={component?.name}
          placeholder="Red rose stem"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          type="url"
          defaultValue={component?.imageUrl ?? ""}
          placeholder="https://…"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unitPrice">Price (PKR)</Label>
          <Input
            id="unitPrice"
            name="unitPrice"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={component?.unitPrice ?? 0}
          />
        </div>
        <div>
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min={0}
            required
            defaultValue={component?.stock ?? 0}
          />
        </div>
        <div>
          <Label htmlFor="minQty">Min qty</Label>
          <Input
            id="minQty"
            name="minQty"
            type="number"
            min={0}
            defaultValue={component?.minQty ?? 0}
          />
        </div>
        <div>
          <Label htmlFor="maxQty">Max qty</Label>
          <Input
            id="maxQty"
            name="maxQty"
            type="number"
            min={1}
            defaultValue={component?.maxQty ?? 50}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="productId">Link to raw-material product (optional)</Label>
        <select
          id="productId"
          name="productId"
          defaultValue={component?.productId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
        >
          <option value="">— none —</option>
          {productOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink/50">
          When linked, checkout decrements both the builder component and this
          product&apos;s stock.
        </p>
      </div>

      <div>
        <Label htmlFor="sortOrder">Sort order</Label>
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={component?.sortOrder ?? 0}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={component?.isActive ?? true}
          className="size-4 accent-burgundy"
        />
        Visible in the builder
      </label>

      <FieldError message={error ?? undefined} />

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : isEdit ? "Save changes" : "Add component"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="secondary"
            disabled={remove.isPending}
            onClick={() => {
              if (confirm("Delete this component from the builder?")) {
                remove.mutate();
              }
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
