import { NextResponse } from "next/server";
import { UploadError, uploadImage, uploadVideo } from "@/lib/uploads";

/**
 * Upload endpoint for receipts, product photos, and CMS media.
 * Size/type limited in lib/uploads. Folder defaults to "receipts".
 */
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const folder = String(form.get("folder") ?? "receipts");
  const kind = String(form.get("kind") ?? "image");

  try {
    const result =
      kind === "video"
        ? await uploadVideo(file, folder)
        : await uploadImage(file, folder);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[uploads]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
