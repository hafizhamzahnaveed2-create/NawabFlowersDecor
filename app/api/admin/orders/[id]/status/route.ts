import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { orderStatusSchema } from "@/lib/validation/admin";
import { updateOrderStatus } from "@/lib/repositories/admin/orders";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("orders.fulfill");
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await updateOrderStatus(id, parsed.data.status, session.user.id);
  return NextResponse.json({ order });
}
