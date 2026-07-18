import { z } from "zod";
import { mediaUrlSchema, optionalMediaUrlSchema } from "@/lib/validation/media";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);

export const productFormSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(150),
  type: z.enum(["BOUQUET", "RAW_MATERIAL", "ADDON", "SERVICE"]),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  categoryId: z.string().min(1, "Choose a category"),
  subCategoryId: z.preprocess(emptyToNull, z.string().nullable()),
  sku: z.preprocess(emptyToNull, z.string().trim().max(50).nullable()),

  price: z.coerce.number().positive("Price must be greater than zero"),
  salePrice: z.preprocess(
    emptyToNull,
    z.coerce.number().positive("Sale price must be greater than zero").nullable(),
  ),
  saleStartsAt: z.preprocess(emptyToNull, z.string().nullable()), // yyyy-mm-dd
  saleEndsAt: z.preprocess(emptyToNull, z.string().nullable()),

  stock: z.coerce.number().int().min(0, "Stock can't be negative"),

  isBestSeller: z.boolean(),
  isNewArrival: z.boolean(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),

  images: z
    .array(
      z.object({
        url: z.string().trim().url("Enter a valid image URL"),
        alt: z.string().trim().max(200).optional().or(z.literal("")),
      }),
    )
    .max(8, "Up to 8 photos"),

  variants: z
    .array(
      z.object({
        id: z.string().optional(), // present when editing an existing variant
        name: z.string().trim().min(1, "Variant name is required").max(80),
        price: z.coerce.number().positive("Variant price must be greater than zero"),
        stock: z.coerce.number().int().min(0),
      }),
    )
    .max(10, "Up to 10 variants"),
})
.refine(
  (data) => data.salePrice == null || data.salePrice < data.price,
  { message: "Sale price must be below the regular price", path: ["salePrice"] },
);

export type ProductFormInput = z.infer<typeof productFormSchema>;

export const orderStatusSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
});

export const contentBlockFormSchema = z.object({
  key: z.enum(["home.hero", "announcement.main", "announcement.ticker"]),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().max(1000).optional().or(z.literal("")),
  imageUrl: mediaUrlSchema,
  videoUrl: optionalMediaUrlSchema,
  linkUrl: z.preprocess(emptyToNull, z.string().trim().max(300).nullable()),
  isPublished: z.boolean(),
});

export type ContentBlockFormInput = z.infer<typeof contentBlockFormSchema>;
