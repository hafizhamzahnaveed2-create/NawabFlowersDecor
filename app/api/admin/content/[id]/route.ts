import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { cmsBlockSchema } from "@/lib/validation/cms";
import {
  deleteCmsBlock,
  updateCmsBlock,
} from "@/lib/repositories/content";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("content.write");
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = cmsBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  try {
    const block = await updateCmsBlock(id, parsed.data, session.user.id);
    return NextResponse.json({ block });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("content.write");
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deleteCmsBlock(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
