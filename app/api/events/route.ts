import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storeEventSchema } from "@/lib/validation/analytics";
import { recordStoreEvent } from "@/lib/repositories/events";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = storeEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const session = await auth();
  // Fire-and-forget style: don't fail the shop if logging hiccups.
  try {
    await recordStoreEvent(parsed.data, session?.user?.id);
  } catch (error) {
    console.error("[events]", error);
  }
  return NextResponse.json({ ok: true });
}
