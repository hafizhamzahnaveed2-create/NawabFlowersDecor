import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { paymentVerifySchema } from "@/lib/validation/settings";
import { verifyOrderPayment } from "@/lib/repositories/admin/orders";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("orders.fulfill");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = paymentVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }
  try {
    await verifyOrderPayment(id, parsed.data.decision, session.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
