import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { paymentAccountSchema } from "@/lib/validation/settings";
import {
  createPaymentAccount,
  listPaymentAccounts,
} from "@/lib/repositories/settings";

export async function GET() {
  const session = await requirePermission("payments.write");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ accounts: await listPaymentAccounts() });
}

export async function POST(request: Request) {
  const session = await requirePermission("payments.write");
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = paymentAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const account = await createPaymentAccount(parsed.data, session.user.id);
    return NextResponse.json({ account }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create — slug may already exist" },
      { status: 409 },
    );
  }
}
