import { z } from "zod";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

/** Absolute http(s) URL or a local /uploads/… path from the upload API. */
const mediaUrlString = z
  .string()
  .trim()
  .refine(
    (v) =>
      /^https?:\/\//i.test(v) ||
      /^\/uploads\/[A-Za-z0-9._/-]+$/.test(v),
    "Enter a valid URL or upload a file",
  );

export const mediaUrlSchema = z.preprocess(
  emptyToNull,
  mediaUrlString.nullable(),
);

export const optionalMediaUrlSchema = z.preprocess(
  emptyToNull,
  mediaUrlString.nullable().optional(),
);
