import { z } from "zod";
import { optionalMediaUrlSchema } from "@/lib/validation/media";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and dashes",
  );

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional().or(z.literal("")),
  description: z.preprocess(
    emptyToNull,
    z.string().trim().max(500).nullable().optional(),
  ),
  imageUrl: optionalMediaUrlSchema,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const subCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional().or(z.literal("")),
  imageUrl: optionalMediaUrlSchema,
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type SubCategoryInput = z.infer<typeof subCategorySchema>;
