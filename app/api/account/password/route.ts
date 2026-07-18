import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { changeAccountPassword } from "@/lib/repositories/account";
import { changePasswordSchema } from "@/lib/validation/account";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    await changeAccountPassword(session.user.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CURRENT_PASSWORD_INVALID") {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }
      if (error.message === "PASSWORD_NOT_SET") {
        return NextResponse.json(
          { error: "This account cannot change password here" },
          { status: 400 },
        );
      }
    }
    console.error("[account/password]", error);
    return NextResponse.json(
      { error: "Could not change password" },
      { status: 500 },
    );
  }
}
