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
  platform: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and dashes (e.g. pinterest)",
    ),
  url: z.string().trim().url(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isEnabled: z.boolean().default(false),
});

export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

/** Built-in social networks shown in the admin picker. */
export const KNOWN_SOCIAL_PLATFORMS = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "whatsapp",
  "pinterest",
  "snapchat",
  "linkedin",
  "x",
] as const;

export const whatsappSettingSchema = z.object({
  number: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Digits only, country code included (e.g. 92300…)"),
});

export const maintenanceSettingSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().min(1).max(500),
});

export type MaintenanceSettingInput = z.infer<typeof maintenanceSettingSchema>;

export const featureFlagsSchema = z.object({
  builder: z.boolean(),
  reviews: z.boolean(),
  newsletter: z.boolean(),
});

export type FeatureFlagsInput = z.infer<typeof featureFlagsSchema>;

export const deliveryScheduleSchema = z.object({
  /** When true, checkout allows selecting today (min lead days = 0). */
  sameDayDelivery: z.boolean(),
  /** How many days ahead customers may book (1–90). */
  maxLeadDays: z.coerce.number().int().min(1).max(90),
});

export type DeliveryScheduleInput = z.infer<typeof deliveryScheduleSchema>;

export const paymentVerifySchema = z.object({
  decision: z.enum(["VERIFIED", "REJECTED"]),
});
