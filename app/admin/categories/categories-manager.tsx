"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";

type SubRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  subCategories: SubRow[];
  _count: { products: number };
};

export function CategoriesManager({
  initialCategories,
}: {
  initialCategories: CategoryRow[];
}) {
  const router = useRouter();
  const [catError, setCatError] = useState<string | null>(null);
  const [subError, setSubError] = useState<string | null>(null);
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);
  const [editingSub, setEditingSub] = useState<
    (SubRow & { categoryId: string }) | null
  >(null);

  const saveCategory = useMutation({
    mutationFn: async (form: FormData) => {
      const body = {
        kind: "category",
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
        description: String(form.get("description") ?? ""),
        sortOrder: Number(form.get("sortOrder") ?? 0),
        isActive: form.get("isActive") === "on",
      };
      const res = await fetch(
        editingCat
          ? `/api/admin/categories/${editingCat.id}`
          : "/api/admin/categories",
        {
          method: editingCat ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save category");
    },
    onSuccess: () => {
      setCatError(null);
      setEditingCat(null);
      router.refresh();
    },
    onError: (e: Error) => setCatError(e.message),
  });

  const saveSub = useMutation({
    mutationFn: async (form: FormData) => {
      const body = {
        kind: "subcategory",
        categoryId: String(form.get("categoryId") ?? ""),
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
        sortOrder: Number(form.get("sortOrder") ?? 0),
        isActive: form.get("isActive") === "on",
      };
      const res = await fetch(
        editingSub
          ? `/api/admin/categories/${editingSub.id}`
          : "/api/admin/categories",
        {
          method: editingSub ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save sub-category");
    },
    onSuccess: () => {
      setSubError(null);
      setEditingSub(null);
      router.refresh();
    },
    onError: (e: Error) => setSubError(e.message),
  });

  async function removeCategory(id: string) {
    if (!confirm("Delete this category and its empty sub-categories?")) return;
    const res = await fetch(`/api/admin/categories/${id}?kind=category`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Could not delete");
      return;
    }
    router.refresh();
  }

  async function removeSub(id: string) {
    if (!confirm("Delete this sub-category?")) return;
    const res = await fetch(`/api/admin/categories/${id}?kind=subcategory`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Could not delete");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">Your categories</h2>
        <p className="mt-1 text-sm text-ink/60">
          These appear in the shop header, homepage, and product form. Add
          bouquets, decorations, gifts — whatever you sell.
        </p>

        <ul className="mt-5 divide-y divide-stone border-t border-stone">
          {initialCategories.length === 0 ? (
            <li className="py-6 text-sm text-ink/50">No categories yet.</li>
          ) : (
            initialCategories.map((c) => (
              <li key={c.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {c.name}{" "}
                      <span className="text-xs font-normal text-ink/40">
                        /{c.slug}
                      </span>
                      {!c.isActive && (
                        <span className="ml-2 text-xs text-ink/40">hidden</span>
                      )}
                    </p>
                    <p className="text-xs text-ink/50">
                      {c._count.products} product
                      {c._count.products === 1 ? "" : "s"} · sort {c.sortOrder}
                    </p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      className="text-sage hover:text-burgundy"
                      onClick={() => setEditingCat(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-ink/40 hover:text-burgundy"
                      onClick={() => removeCategory(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {c.subCategories.length > 0 && (
                  <ul className="mt-3 ml-3 space-y-2 border-l border-stone pl-4">
                    {c.subCategories.map((s) => (
                      <li
                        key={s.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span>
                          {s.name}{" "}
                          <span className="text-ink/40">/{s.slug}</span>
                          {!s.isActive && (
                            <span className="ml-2 text-xs text-ink/40">
                              hidden
                            </span>
                          )}
                          <span className="ml-2 text-xs text-ink/40">
                            {s._count.products} products
                          </span>
                        </span>
                        <span className="flex gap-2 text-xs">
                          <button
                            type="button"
                            className="text-sage hover:text-burgundy"
                            onClick={() =>
                              setEditingSub({ ...s, categoryId: c.id })
                            }
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-ink/40 hover:text-burgundy"
                            onClick={() => removeSub(s.id)}
                          >
                            Delete
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))
          )}
        </ul>
      </section>

      <form
        key={editingCat?.id ?? "new-cat"}
        className="rounded-petal border border-stone bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveCategory.mutate(new FormData(e.currentTarget));
        }}
      >
        <h2 className="font-display text-xl text-burgundy">
          {editingCat ? `Edit “${editingCat.name}”` : "Add category"}
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Examples: Bouquets, Decorations, Gift Add-ons.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              name="name"
              required
              defaultValue={editingCat?.name ?? ""}
              placeholder="Decorations"
            />
          </div>
          <div>
            <Label htmlFor="cat-slug">Slug (optional)</Label>
            <Input
              id="cat-slug"
              name="slug"
              defaultValue={editingCat?.slug ?? ""}
              placeholder="decorations"
            />
          </div>
          <div>
            <Label htmlFor="cat-sort">Sort order</Label>
            <Input
              id="cat-sort"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={editingCat?.sortOrder ?? 0}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <Textarea
              id="cat-desc"
              name="description"
              rows={2}
              defaultValue={editingCat?.description ?? ""}
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={editingCat?.isActive ?? true}
            className="accent-burgundy"
          />
          Show on the shop
        </label>
        <FieldError message={catError ?? undefined} />
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={saveCategory.isPending}>
            {saveCategory.isPending
              ? "Saving…"
              : editingCat
                ? "Update category"
                : "Create category"}
          </Button>
          {editingCat && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingCat(null)}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <form
        key={editingSub?.id ?? "new-sub"}
        className="rounded-petal border border-stone bg-white p-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveSub.mutate(new FormData(e.currentTarget));
        }}
      >
        <h2 className="font-display text-xl text-burgundy">
          {editingSub ? `Edit “${editingSub.name}”` : "Add sub-category"}
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Examples under Bouquets: Chocolate bouquets, Currency bouquets. Under
          Decorations: Car décor, Stage décor.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="sub-cat">Parent category</Label>
            <select
              id="sub-cat"
              name="categoryId"
              required
              defaultValue={
                editingSub?.categoryId ?? initialCategories[0]?.id ?? ""
              }
              className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
            >
              {initialCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="sub-name">Name</Label>
            <Input
              id="sub-name"
              name="name"
              required
              defaultValue={editingSub?.name ?? ""}
              placeholder="Car decoration"
            />
          </div>
          <div>
            <Label htmlFor="sub-slug">Slug (optional)</Label>
            <Input
              id="sub-slug"
              name="slug"
              defaultValue={editingSub?.slug ?? ""}
              placeholder="car-decoration"
            />
          </div>
          <div>
            <Label htmlFor="sub-sort">Sort order</Label>
            <Input
              id="sub-sort"
              name="sortOrder"
              type="number"
              min={0}
              defaultValue={editingSub?.sortOrder ?? 0}
            />
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={editingSub?.isActive ?? true}
            className="accent-burgundy"
          />
          Show on the shop
        </label>
        <FieldError message={subError ?? undefined} />
        <div className="mt-4 flex gap-2">
          <Button type="submit" disabled={saveSub.isPending}>
            {saveSub.isPending
              ? "Saving…"
              : editingSub
                ? "Update sub-category"
                : "Create sub-category"}
          </Button>
          {editingSub && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingSub(null)}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
