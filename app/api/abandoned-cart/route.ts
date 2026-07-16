import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { abandonedCartSchema } from "@/lib/validation/growth";
import {
  processAbandonedCartReminders,
  syncAbandonedCart,
} from "@/lib/repositories/retention";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = abandonedCartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const session = await auth();
  await syncAbandonedCart(
    parsed.data.email,
    parsed.data.cartSnapshot,
    session?.user?.id,
  );
  return NextResponse.json({ ok: true });
}

/** Staff/cron endpoint: process idle carts for reminder emails (stubbed). */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (secret && authHeader === `Bearer ${secret}`) {
    const results = await processAbandonedCartReminders();
    return NextResponse.json({ processed: results.length, results });
  }
  // Fall back to staff session for manual trigger from admin.
  const { requireStaff } = await import("@/lib/auth-helpers");
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results = await processAbandonedCartReminders();
  return NextResponse.json({ processed: results.length, results });
}
