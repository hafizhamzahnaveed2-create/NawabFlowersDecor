import { z } from "zod";

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  area: z.string().trim().max(80).optional().or(z.literal("")),
  fee: z.coerce.number().min(0).max(999_999),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>;

export const taxRuleSchema = z.object({
  name: z.string().trim().min(2).max(80),
  ratePercent: z.coerce.number().min(0).max(100),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export type TaxRuleInput = z.infer<typeof taxRuleSchema>;
