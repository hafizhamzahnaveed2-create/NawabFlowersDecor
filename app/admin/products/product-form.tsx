"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import {
  productFormSchema,
  type ProductFormInput,
} from "@/lib/validation/admin";
import type { CategoryNav } from "@/lib/repositories/categories";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";

type ImageRow = { url: string; alt: string };
type VariantRow = { id?: string; name: string; price: string; stock: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  type: "BOUQUET" | "RAW_MATERIAL" | "ADDON" | "SERVICE";
  description: string;
  categoryId: string;
  subCategoryId: string | null;
  sku: string | null;
  price: number | null;
  salePrice: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  stock: number;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  isActive: boolean;
  images: { url: string; alt: string }[];
  variants: { id?: string; name: string; price: number; stock: number }[];
};

const emptyValues: ProductFormValues = {
  name: "",
  type: "BOUQUET",
  description: "",
  categoryId: "",
  subCategoryId: null,
  sku: null,
  price: null,
  salePrice: null,
  saleStartsAt: null,
  saleEndsAt: null,
  stock: 0,
  isBestSeller: false,
  isNewArrival: false,
  isFeatured: false,
  isActive: true,
  images: [],
  variants: [],
};

export function ProductForm({
  categories,
  initial,
}: {
  categories: CategoryNav[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const values = initial ?? emptyValues;

  const [categoryId, setCategoryId] = useState(values.categoryId);
  const [images, setImages] = useState<ImageRow[]>(values.images);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantRow[]>(
    values.variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: String(v.price),
      stock: String(v.stock),
    })),
  );
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  async function handlePhotoUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.set("file", file);
        fd.set("folder", "products");
        const res = await fetch("/api/uploads", { method: "POST", body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? "Could not upload that photo");
        }
        setImages((arr) => [...arr, { url: data.url as string, alt: "" }]);
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const subCategories =
    categories.find((c) => c.id === categoryId)?.subCategories ?? [];

  const save = useMutation({
    mutationFn: async (input: ProductFormInput) => {
      const res = await fetch(
        isEdit ? `/api/admin/products/${initial!.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save the product");
      return data.product as { id: string };
    },
    onSuccess: () => {
      router.push("/admin/products");
      router.refresh();
    },
    onError: (e: Error) => setServerError(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/products/${initial!.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not delete the product");
    },
    onSuccess: () => {
      router.push("/admin/products");
      router.refresh();
    },
    onError: (e: Error) => setServerError(e.message),
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setServerError(null);

    const fd = new FormData(event.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      type: String(fd.get("type") ?? "BOUQUET"),
      description: String(fd.get("description") ?? ""),
      categoryId: String(fd.get("categoryId") ?? ""),
      subCategoryId: String(fd.get("subCategoryId") ?? ""),
      sku: String(fd.get("sku") ?? ""),
      price: String(fd.get("price") ?? ""),
      salePrice: String(fd.get("salePrice") ?? ""),
      saleStartsAt: String(fd.get("saleStartsAt") ?? ""),
      saleEndsAt: String(fd.get("saleEndsAt") ?? ""),
      stock: String(fd.get("stock") ?? "0"),
      isBestSeller: fd.get("isBestSeller") === "on",
      isNewArrival: fd.get("isNewArrival") === "on",
      isFeatured: fd.get("isFeatured") === "on",
      isActive: fd.get("isActive") === "on",
      images,
      variants: variants
        .filter((v) => v.name.trim() || v.price || v.stock)
        .map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price,
          stock: v.stock,
        })),
    };

    const parsed = productFormSchema.safeParse(raw);
    if (!parsed.success) {
      const flat: Partial<Record<string, string>> = {};
      const tree = z.flattenError(parsed.error);
      for (const [key, msgs] of Object.entries(tree.fieldErrors)) {
        if (msgs?.[0]) flat[key] = msgs[0];
      }
      // Surface nested variant/image errors in a general spot
      if (!Object.keys(flat).length && tree.formErrors[0]) {
        setServerError(tree.formErrors[0]);
      } else if (parsed.error.issues[0] && !Object.keys(flat).length) {
        setServerError(parsed.error.issues[0].message);
      }
      setErrors(flat);
      return;
    }
    save.mutate(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-3xl space-y-6 pb-28">
      {/* Basics */}
      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">The basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Product name</Label>
            <Input id="name" name="name" defaultValue={values.name} placeholder="e.g. Blush Rose Hand-Tied" />
            <FieldError message={errors.name} />
          </div>
          <div>
            <Label htmlFor="type">What kind of product is this?</Label>
            <select
              id="type"
              name="type"
              defaultValue={values.type}
              className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
            >
              <option value="BOUQUET">Bouquet</option>
              <option value="RAW_MATERIAL">Raw material (stem, wrap, vase…)</option>
              <option value="ADDON">Gift add-on</option>
              <option value="SERVICE">Decoration / event service</option>
            </select>
            <p className="mt-1.5 text-xs text-ink/50">
              Need a new category? Manage them under{" "}
              <a href="/admin/categories" className="text-sage underline-offset-2 hover:underline">
                Categories
              </a>
              .
            </p>
          </div>
          <div>
            <Label htmlFor="sku">SKU (optional)</Label>
            <Input id="sku" name="sku" defaultValue={values.sku ?? ""} />
          </div>
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
            >
              <option value="">Choose…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.categoryId} />
          </div>
          <div>
            <Label htmlFor="subCategoryId">Sub-category</Label>
            <select
              id="subCategoryId"
              name="subCategoryId"
              defaultValue={values.subCategoryId ?? ""}
              className="mt-1.5 w-full rounded-lg border border-stone bg-white px-3.5 py-2.5"
            >
              <option value="">None</option>
              {subCategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={values.description}
              placeholder="What makes this lovely? Customers see this on the product page."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">Pricing & stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="price">Price (PKR)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={0}
              defaultValue={values.price ?? ""}
            />
            <FieldError message={errors.price} />
          </div>
          <div>
            <Label htmlFor="salePrice">Sale price (optional)</Label>
            <Input
              id="salePrice"
              name="salePrice"
              type="number"
              min={0}
              defaultValue={values.salePrice ?? ""}
            />
            <FieldError message={errors.salePrice} />
          </div>
          <div>
            <Label htmlFor="stock">Stock quantity</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min={0}
              defaultValue={values.stock}
            />
            <FieldError message={errors.stock} />
          </div>
          <div>
            <Label htmlFor="saleStartsAt">Sale starts (optional)</Label>
            <Input
              id="saleStartsAt"
              name="saleStartsAt"
              type="date"
              defaultValue={values.saleStartsAt ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="saleEndsAt">Sale ends (optional)</Label>
            <Input
              id="saleEndsAt"
              name="saleEndsAt"
              type="date"
              defaultValue={values.saleEndsAt ?? ""}
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-ink/60">
          With a sale price set, the product automatically appears in the
          storefront&apos;s “On sale” rail during the chosen dates.
        </p>
      </section>

      {/* Photos */}
      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">Photos</h2>
        <p className="mt-1 text-sm text-ink/60">
          Upload photos from your phone or computer. The first photo is the main
          shop image — use the arrows to reorder.
        </p>

        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone bg-ivory/60 px-4 py-8 text-center transition-colors hover:border-burgundy/40 hover:bg-blush/20">
          <span className="font-semibold text-burgundy">
            {uploading ? "Uploading…" : "Choose photo to upload"}
          </span>
          <span className="mt-1 text-sm text-ink/55">
            JPEG, PNG, or WebP · under 5 MB
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            disabled={uploading}
            className="sr-only"
            onChange={(e) => {
              void handlePhotoUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
        {uploadError && (
          <p role="alert" className="mt-2 text-sm text-burgundy">
            {uploadError}
          </p>
        )}

        {images.length > 0 && (
          <ul className="mt-4 space-y-2">
            {images.map((img, index) => (
              <li
                key={`${img.url}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-stone p-2"
              >
                <span className="relative block h-14 w-12 shrink-0 overflow-hidden rounded bg-stone/40">
                  {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-entered URL */}
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-ink/70">
                  Photo {index + 1}
                </span>
                {index === 0 && (
                  <span className="rounded-full bg-blush px-2 py-0.5 text-xs text-burgundy-deep">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={index === 0}
                  onClick={() =>
                    setImages((arr) => {
                      const next = [...arr];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      return next;
                    })
                  }
                  className="rounded border border-stone px-2 py-1 text-sm hover:border-burgundy disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === images.length - 1}
                  onClick={() =>
                    setImages((arr) => {
                      const next = [...arr];
                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                      return next;
                    })
                  }
                  className="rounded border border-stone px-2 py-1 text-sm hover:border-burgundy disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => setImages((arr) => arr.filter((_, i) => i !== index))}
                  className="rounded border border-burgundy/30 px-2 py-1 text-sm text-burgundy hover:bg-burgundy/5"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-ink/70 hover:text-burgundy">
            Or paste an image link instead
          </summary>
          <div className="mt-2 flex gap-2">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="https://…"
              aria-label="New photo URL"
              className="mt-0"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (newImageUrl.trim()) {
                  setImages((arr) => [
                    ...arr,
                    { url: newImageUrl.trim(), alt: "" },
                  ]);
                  setNewImageUrl("");
                }
              }}
            >
              Add link
            </Button>
          </div>
        </details>
      </section>

      {/* Variants */}
      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">
          Sizes & variants (optional)
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          e.g. “12 stems”, “24 stems”. Each has its own price and stock; when
          set, customers choose one on the product page.
        </p>
        {variants.length > 0 && (
          <div className="mt-4 space-y-2">
            {variants.map((v, index) => (
              <div key={v.id ?? index} className="flex items-end gap-2">
                <div className="flex-1">
                  {index === 0 && <Label>Name</Label>}
                  <Input
                    value={v.name}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((row, i) =>
                          i === index ? { ...row, name: e.target.value } : row,
                        ),
                      )
                    }
                    placeholder="12 stems"
                  />
                </div>
                <div className="w-32">
                  {index === 0 && <Label>Price (PKR)</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={v.price}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((row, i) =>
                          i === index ? { ...row, price: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="w-24">
                  {index === 0 && <Label>Stock</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) =>
                      setVariants((arr) =>
                        arr.map((row, i) =>
                          i === index ? { ...row, stock: e.target.value } : row,
                        ),
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remove variant"
                  onClick={() => setVariants((arr) => arr.filter((_, i) => i !== index))}
                  className="mb-2.5 p-1 text-ink/50 hover:text-burgundy"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() =>
            setVariants((arr) => [...arr, { name: "", price: "", stock: "0" }])
          }
        >
          Add variant
        </Button>
      </section>

      {/* Visibility */}
      <section className="rounded-petal border border-stone bg-white p-6">
        <h2 className="font-display text-xl text-burgundy">Visibility</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="size-4 accent-burgundy" />
            <span>
              Live in the shop
              <span className="block text-sm text-ink/60">Untick to hide without deleting</span>
            </span>
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="isBestSeller" defaultChecked={values.isBestSeller} className="size-4 accent-burgundy" />
            <span>Best seller badge</span>
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="isNewArrival" defaultChecked={values.isNewArrival} className="size-4 accent-burgundy" />
            <span>New arrival badge</span>
          </label>
          <label className="flex items-center gap-2.5">
            <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="size-4 accent-burgundy" />
            <span>Featured on homepage</span>
          </label>
        </div>
      </section>

      {serverError && (
        <p role="alert" className="text-sm text-burgundy">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-petal border border-stone bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending || uploading} className="px-6 py-3 text-base">
            {save.isPending
              ? "Saving…"
              : isEdit
                ? "Save changes"
                : "Publish product to shop"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/products")}>
            Back to products
          </Button>
        </div>
        {isEdit && (
          <Button
            type="button"
            variant="secondary"
            disabled={remove.isPending}
            onClick={() => {
              if (
                confirm(
                  "Delete this product permanently?\n\nPast orders keep their records. This cannot be undone.",
                )
              ) {
                remove.mutate();
              }
            }}
            className="border-burgundy/40 text-burgundy hover:bg-burgundy/5"
          >
            {remove.isPending ? "Deleting…" : "Delete product"}
          </Button>
        )}
      </div>
    </form>
  );
}
