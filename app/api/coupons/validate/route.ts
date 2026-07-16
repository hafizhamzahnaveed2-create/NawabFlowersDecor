import { NextResponse } from "next/server";
import { CouponError, validateCoupon } from "@/lib/repositories/coupons";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const subtotal = Number(body?.subtotal ?? 0);
  if (!code || Number.isNaN(subtotal)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const result = await validateCoupon(code, subtotal);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
