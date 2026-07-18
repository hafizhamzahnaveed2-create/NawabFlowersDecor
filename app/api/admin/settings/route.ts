import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  socialLinkSchema,
  whatsappSettingSchema,
  maintenanceSettingSchema,
  featureFlagsSchema,
  deliveryScheduleSchema,
} from "@/lib/validation/settings";
import {
  deleteSocialLink,
  getWhatsAppNumber,
  listSocialLinks,
  setWhatsAppNumber,
  upsertSocialLink,
  getMaintenanceSettings,
  setMaintenanceSettings,
  getFeatureFlags,
  setFeatureFlags,
  setDeliveryScheduleSettings,
} from "@/lib/repositories/settings";

export async function GET() {
  const session = await requirePermission("settings.write");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [whatsapp, socials] = await Promise.all([
    getWhatsAppNumber(),
    listSocialLinks(),
  ]);
  return NextResponse.json({ whatsapp, socials });
}

export async function PUT(request: Request) {
  const session = await requirePermission("settings.write");
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
  if (body?.kind === "maintenance") {
    const parsed = maintenanceSettingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid maintenance settings" }, { status: 400 });
    }
    await setMaintenanceSettings(parsed.data, session.user.id);
    return NextResponse.json({ ok: true });
  }
  if (body?.kind === "features") {
    const parsed = featureFlagsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid feature flags" }, { status: 400 });
    }
    await setFeatureFlags(parsed.data, session.user.id);
    return NextResponse.json({ ok: true });
  }
  if (body?.kind === "deliverySchedule") {
    const parsed = deliveryScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid delivery schedule settings" },
        { status: 400 },
      );
    }
    await setDeliveryScheduleSettings(parsed.data, session.user.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const session = await requirePermission("settings.write");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await deleteSocialLink(id, session.user.id);
  return NextResponse.json({ ok: true });
}
