import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const VIDEO_MAX_BYTES = 40 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
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
    case "video/mp4":
      return "mp4";
    case "video/webm":
      return "webm";
    case "video/quicktime":
      return "mov";
    default:
      return "bin";
  }
}

async function storeUpload(
  file: File,
  folder: string,
): Promise<{ url: string }> {
  const safeFolder =
    folder.replace(/[^a-z0-9/_-]/gi, "").replace(/^\/+|\/+$/g, "") || "misc";
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

/**
 * Shared image upload used by receipts, products, and CMS.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise writes under
 * public/uploads/ for local development.
 */
export async function uploadImage(
  file: File,
  folder: string,
): Promise<{ url: string }> {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new UploadError("Only JPEG, PNG, WebP, or GIF images are allowed");
  }
  if (file.size <= 0 || file.size > IMAGE_MAX_BYTES) {
    throw new UploadError("Image must be under 5 MB");
  }
  return storeUpload(file, folder);
}

/** Hero / CMS video clips (mp4, webm, mov). */
export async function uploadVideo(
  file: File,
  folder: string,
): Promise<{ url: string }> {
  if (!VIDEO_TYPES.has(file.type)) {
    throw new UploadError("Only MP4, WebM, or MOV videos are allowed");
  }
  if (file.size <= 0 || file.size > VIDEO_MAX_BYTES) {
    throw new UploadError("Video must be under 40 MB");
  }
  return storeUpload(file, folder);
}
