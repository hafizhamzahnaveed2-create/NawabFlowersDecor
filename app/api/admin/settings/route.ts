import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import {
  socialLinkSchema,
  whatsappSettingSchema,
} from "@/lib/validation/settings";
import {
  deleteSocialLink,
  getWhatsAppNumber,
  listSocialLinks,
  setWhatsAppNumber,
  upsertSocialLink,
} from "@/lib/repositories/settings";

export async function GET() {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [whatsapp, socials] = await Promise.all([
    getWhatsAppNumber(),
    listSocialLinks(),
  ]);
  return NextResponse.json({ whatsapp, socials });
}

export async function PUT(request: Request) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.kind === "whatsapp") {
    const parsed = whatsappSettingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid WhatsApp number" }, { status: 400 });
    }
    await setWhatsAppNumber(parsed.data.number, session.user.id);
    return NextResponse.json({ ok: true });
  }
  if (body?.kind === "social") {
    const parsed = socialLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid social link" }, { status: 400 });
    }
    const link = await upsertSocialLink(parsed.data, session.user.id);
    return NextResponse.json({ link });
  }
  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteSocialLink(id, session.user.id);
  return NextResponse.json({ ok: true });
}
