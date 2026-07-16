import { z } from "zod";

export const couponFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .transform((v) => v.toUpperCase()),
  kind: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().positive(),
  minOrderAmount: z.coerce.number().min(0).optional().nullable(),
  startsAt: z.string().optional().or(z.literal("")),
  endsAt: z.string().optional().or(z.literal("")),
  maxRedemptions: z.coerce.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
}).refine(
  (d) => d.kind !== "PERCENT" || d.value <= 100,
  { message: "Percent coupons cannot exceed 100", path: ["value"] },
);

export type CouponFormInput = z.infer<typeof couponFormSchema>;

export const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const abandonedCartSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  cartSnapshot: z.object({
    lines: z.array(z.record(z.string(), z.unknown())),
    subtotal: z.number().min(0),
  }),
});
