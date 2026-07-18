import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  createStaffUser,
  deleteStaffUser,
  listStaffRoles,
  listStaffUsers,
  updateStaffProfile,
} from "@/lib/repositories/admin/staff";
import {
  createStaffUserSchema,
  updateStaffUserSchema,
} from "@/lib/validation/staff";

export async function GET() {
  const session = await requirePermission("staff.manage");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [users, roles] = await Promise.all([listStaffUsers(), listStaffRoles()]);
  return NextResponse.json({ users, roles });
}

export async function POST(request: Request) {
  const session = await requirePermission("staff.manage");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = createStaffUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  try {
    const user = await createStaffUser(parsed.data, session.user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "UNKNOWN";
    if (msg === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }
    if (msg === "INVALID_ROLE") {
      return NextResponse.json({ error: "Invalid staff role" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create user" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requirePermission("staff.manage");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const parsed = updateStaffUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const profile = await updateStaffProfile(
      parsed.data.userId,
      {
        staffRoleId: parsed.data.staffRoleId,
        isActive: parsed.data.isActive,
        role: parsed.data.role,
      },
      session.user.id,
    );
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: staffErrorMessage(e) },
      { status: staffErrorStatus(e) },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requirePermission("staff.manage");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  try {
    await deleteStaffUser(userId, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: staffErrorMessage(e) },
      { status: staffErrorStatus(e) },
    );
  }
}

function staffErrorMessage(e: unknown) {
  const msg = e instanceof Error ? e.message : "UNKNOWN";
  switch (msg) {
    case "NOT_STAFF":
      return "User is not staff";
    case "INVALID_ROLE":
      return "Invalid staff role";
    case "CANNOT_BLOCK_SELF":
      return "You cannot block your own account";
    case "CANNOT_DELETE_SELF":
      return "You cannot delete your own account";
    case "LAST_ADMIN":
      return "Keep at least one active admin account";
    default:
      return "Could not update staff";
  }
}

function staffErrorStatus(e: unknown) {
  const msg = e instanceof Error ? e.message : "";
  if (
    msg === "CANNOT_BLOCK_SELF" ||
    msg === "CANNOT_DELETE_SELF" ||
    msg === "LAST_ADMIN" ||
    msg === "NOT_STAFF" ||
    msg === "INVALID_ROLE"
  ) {
    return 400;
  }
  return 500;
}
