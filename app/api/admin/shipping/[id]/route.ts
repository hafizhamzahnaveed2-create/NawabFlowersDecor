import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  deleteDeliveryZone,
  deleteTaxRule,
  updateDeliveryZone,
  updateTaxRule,
} from "@/lib/repositories/admin/shipping";
import { deliveryZoneSchema, taxRuleSchema } from "@/lib/validation/shipping";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("settings.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.kind === "zone") {
    const parsed = deliveryZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid zone" }, { status: 400 });
    }
    try {
      const zone = await updateDeliveryZone(id, parsed.data, session.user.id);
      return NextResponse.json({ zone });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  if (body?.kind === "tax") {
    const parsed = taxRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tax rule" }, { status: 400 });
    }
    try {
      const taxRule = await updateTaxRule(id, parsed.data, session.user.id);
      return NextResponse.json({ taxRule });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }
  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("settings.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  try {
    if (kind === "zone") {
      await deleteDeliveryZone(id, session.user.id);
    } else if (kind === "tax") {
      await deleteTaxRule(id, session.user.id);
    } else {
      return NextResponse.json({ error: "kind required" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
