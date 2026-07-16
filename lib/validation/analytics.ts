import { z } from "zod";

export const analyticsRangeSchema = z.object({
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type AnalyticsRangeInput = z.infer<typeof analyticsRangeSchema>;

export const exportTypeSchema = z.enum(["orders", "products", "newsletter"]);

export const storeEventKinds = [
  "page_view",
  "product_view",
  "add_to_cart",
  "cta_click",
  "checkout_start",
] as const;

export const storeEventSchema = z.object({
  kind: z.enum(storeEventKinds),
  path: z.string().trim().max(300).optional().nullable(),
  productId: z.string().trim().max(40).optional().nullable(),
  sessionId: z.string().trim().max(80).optional().nullable(),
  meta: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type StoreEventInput = z.infer<typeof storeEventSchema>;
