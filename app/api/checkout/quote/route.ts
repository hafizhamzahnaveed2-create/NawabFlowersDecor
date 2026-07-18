import { NextResponse } from "next/server";
import { quoteCheckoutTotals } from "@/lib/delivery-pricing";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const city = url.searchParams.get("city") ?? "";
  const area = url.searchParams.get("area") ?? undefined;
  const subtotal = Number(url.searchParams.get("subtotal") ?? "0");
  const discount = Number(url.searchParams.get("discount") ?? "0");

  if (!city.trim()) {
    return NextResponse.json({ error: "city required" }, { status: 400 });
  }
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "Invalid subtotal" }, { status: 400 });
  }
  if (!Number.isFinite(discount) || discount < 0) {
    return NextResponse.json({ error: "Invalid discount" }, { status: 400 });
  }

  const quote = await quoteCheckoutTotals({
    subtotal,
    discountAmount: discount,
    city,
    area: area || null,
  });

  return NextResponse.json(quote);
}
