import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { bouquetComponentSchema } from "@/lib/validation/builder";
import {
  deleteBuilderComponent,
  updateBuilderComponent,
} from "@/lib/repositories/builder";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = bouquetComponentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const component = await updateBuilderComponent(
      id,
      parsed.data,
      session.user.id,
    );
    return NextResponse.json({ component });
  } catch {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await deleteBuilderComponent(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Component not found" }, { status: 404 });
  }
}
