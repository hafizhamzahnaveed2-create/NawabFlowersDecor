import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validation/checkout";
import { CheckoutError, createOrder } from "@/lib/repositories/orders";
import { getMaintenanceSettings } from "@/lib/repositories/settings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [session, maintenance] = await Promise.all([auth(), getMaintenanceSettings()]);
  const isStaff =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";
  if (maintenance.enabled && !isStaff) {
    return NextResponse.json({ error: maintenance.message }, { status: 503 });
  }

  try {
    const order = await createOrder(parsed.data, session?.user?.id ?? null);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Checkout failed:", error);
    return NextResponse.json(
      { error: "Something went wrong placing your order. Please try again." },
      { status: 500 },
    );
  }
}
