import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAccountProfile,
  updateAccountProfile,
} from "@/lib/repositories/account";
import { updateProfileSchema } from "@/lib/validation/account";
import { UploadError, uploadImage } from "@/lib/uploads";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getAccountProfile(session.user.id);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const name = String(form.get("name") ?? "");
      const phone = String(form.get("phone") ?? "");
      const clearImage = form.get("clearImage") === "1";
      const file = form.get("image");

      let image: string | null | undefined = undefined;
      if (clearImage) {
        image = null;
      } else if (file instanceof File && file.size > 0) {
        const uploaded = await uploadImage(file, "avatars");
        image = uploaded.url;
      }

      const parsed = updateProfileSchema.safeParse({ name, phone, image });
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input" },
          { status: 400 },
        );
      }

      const profile = await updateAccountProfile(session.user.id, parsed.data);
      return NextResponse.json(profile);
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const profile = await updateAccountProfile(session.user.id, parsed.data);
    return NextResponse.json(profile);
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[account/profile]", error);
    return NextResponse.json({ error: "Could not update profile" }, { status: 500 });
  }
}
