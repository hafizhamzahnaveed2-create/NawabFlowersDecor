import { NextResponse } from "next/server";
import { newsletterSchema } from "@/lib/validation/growth";
import { subscribeNewsletter } from "@/lib/repositories/retention";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = newsletterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }
  await subscribeNewsletter(parsed.data.email);
  return NextResponse.json({ ok: true });
}
