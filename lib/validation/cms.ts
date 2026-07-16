import { z } from "zod";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

/** Legacy fixed-key upsert (announcement + primary hero). */
export const contentBlockFormSchema = z.object({
  key: z.enum(["home.hero", "announcement.main"]),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().max(2000).optional().or(z.literal("")),
  imageUrl: z.preprocess(
    emptyToNull,
    z.string().trim().url("Enter a valid image URL").nullable(),
  ),
  linkUrl: z.preprocess(
    emptyToNull,
    z.string().trim().max(300).nullable(),
  ),
  isPublished: z.boolean(),
});

export type ContentBlockFormInput = z.infer<typeof contentBlockFormSchema>;

export const contentBlockKinds = [
  "HERO_SLIDE",
  "BANNER",
  "ANNOUNCEMENT",
  "TESTIMONIAL",
  "FAQ",
  "POLICY",
  "SECTION",
] as const;

export type ContentBlockKindInput = (typeof contentBlockKinds)[number];

/** Create / update any CMS block (Phase 6). */
export const cmsBlockSchema = z.object({
  kind: z.enum(contentBlockKinds),
  key: z
    .string()
    .trim()
    .min(3)
    .max(80)
    .regex(
      /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
      "Use lowercase letters, numbers, dots, dashes",
    ),
  title: z.string().trim().max(200).optional().or(z.literal("")),
  body: z.string().trim().max(20000).optional().or(z.literal("")),
  imageUrl: z.preprocess(
    emptyToNull,
    z.string().trim().url("Enter a valid image URL").nullable().optional(),
  ),
  linkUrl: z.preprocess(
    emptyToNull,
    z.string().trim().max(300).nullable().optional(),
  ),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  /** Free-form extras: excerpt, ctaLabel, delayMs, etc. */
  data: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CmsBlockInput = z.infer<typeof cmsBlockSchema>;
