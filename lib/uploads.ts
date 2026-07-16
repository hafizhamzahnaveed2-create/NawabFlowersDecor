import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function extensionFor(mime: string) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

/**
 * Shared image upload used by receipt screenshots (and later product images).
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise writes under
 * public/uploads/ for local development.
 */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<{ url: string }> {
  if (!ALLOWED.has(file.type)) {
    throw new UploadError("Only JPEG, PNG, WebP, or GIF images are allowed");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new UploadError("Image must be under 5 MB");
  }

  const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "misc";
  const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${extensionFor(file.type)}`;
  const pathname = `${safeFolder}/${name}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(pathname, bytes, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url };
  }

  const dir = path.join(process.cwd(), "public", "uploads", safeFolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { url: `/uploads/${safeFolder}/${name}` };
}
