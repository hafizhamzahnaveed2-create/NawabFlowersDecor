import { z } from "zod";

export const paymentAccountSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase slug with dashes"),
  accountTitle: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().min(5).max(64),
  iconKey: z.enum(["jazzcash", "easypaisa", "bank", "card"]).default("bank"),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type PaymentAccountInput = z.infer<typeof paymentAccountSchema>;

export const socialLinkSchema = z.object({
  platform: z.enum([
    "instagram",
    "facebook",
    "tiktok",
    "youtube",
    "whatsapp",
  ]),
  url: z.string().trim().url(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isEnabled: z.boolean().default(false),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

export const whatsappSettingSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Digits only, country code included (e.g. 92300…)"),
});

export const paymentVerifySchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
});
