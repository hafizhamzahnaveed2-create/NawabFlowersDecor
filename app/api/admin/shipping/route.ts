import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  createDeliveryZone,
  createTaxRule,
  listDeliveryZones,
  listTaxRules,
} from "@/lib/repositories/admin/shipping";
import { deliveryZoneSchema, taxRuleSchema } from "@/lib/validation/shipping";

export async function GET() {
  const session = await requirePermission("settings.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [zones, taxRules] = await Promise.all([
    listDeliveryZones(),
    listTaxRules(),
  ]);
  return NextResponse.json({ zones, taxRules });
}

export async function POST(request: Request) {
  const session = await requirePermission("settings.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (body?.kind === "zone") {
    const parsed = deliveryZoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid zone" }, { status: 400 });
    }
    const zone = await createDeliveryZone(parsed.data, session.user.id);
    return NextResponse.json({ zone }, { status: 201 });
  }
  if (body?.kind === "tax") {
    const parsed = taxRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tax rule" }, { status: 400 });
    }
    const taxRule = await createTaxRule(parsed.data, session.user.id);
    return NextResponse.json({ taxRule }, { status: 201 });
  }
  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
