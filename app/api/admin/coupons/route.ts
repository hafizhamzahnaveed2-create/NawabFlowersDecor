import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { couponFormSchema } from "@/lib/validation/growth";
import { createCoupon, listCoupons } from "@/lib/repositories/coupons";

export async function GET() {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ coupons: await listCoupons() });
}

export async function POST(request: Request) {
  const session = await requireStaff();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = couponFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const coupon = await createCoupon(parsed.data, session.user.id);
    return NextResponse.json({ coupon }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create coupon — code may already exist" },
      { status: 409 },
    );
  }
}
