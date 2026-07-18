import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { couponFormSchema } from "@/lib/validation/growth";
import { deleteCoupon, updateCoupon } from "@/lib/repositories/coupons";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("coupons.write");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = couponFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const coupon = await updateCoupon(id, parsed.data, session.user.id);
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("coupons.write");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await deleteCoupon(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
