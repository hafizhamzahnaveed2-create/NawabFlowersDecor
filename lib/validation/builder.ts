import { z } from "zod";

export const COMPONENT_KINDS = [
  "STEM",
  "GREENERY",
  "WRAP",
  "RIBBON",
  "VASE",
  "CARD",
] as const;

export const bouquetComponentSchema = z.object({
  kind: z.enum(COMPONENT_KINDS),
  name: z.string().trim().min(2).max(100),
  imageUrl: z.string().url().optional().or(z.literal("")).transform((v) => v || null),
  unitPrice: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  minQty: z.coerce.number().int().min(0).default(0),
  maxQty: z.coerce.number().int().min(1).max(99).default(50),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  productId: z.string().min(1).nullable().optional(),
});

export type BouquetComponentInput = z.infer<typeof bouquetComponentSchema>;

export const builderSelectionItemSchema = z.object({
  componentId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const createCustomBouquetSchema = z.object({
  name: z.string().trim().max(100).optional().or(z.literal("")),
  cardMessage: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(builderSelectionItemSchema).min(1, "Add at least one flower"),
});

export type CreateCustomBouquetInput = z.infer<typeof createCustomBouquetSchema>;
