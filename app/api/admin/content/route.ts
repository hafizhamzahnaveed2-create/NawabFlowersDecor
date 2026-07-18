import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { contentBlockFormSchema } from "@/lib/validation/admin";
import { cmsBlockSchema } from "@/lib/validation/cms";
import {
  createCmsBlock,
  listAllBlocksForAdmin,
  upsertContentBlock,
} from "@/lib/repositories/content";
import { logActivity } from "@/lib/repositories/admin/activity";

export async function GET() {
  const session = await requirePermission("content.write");
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  return NextResponse.json({ blocks: await listAllBlocksForAdmin() });
}

/** Legacy fixed-key upsert (announcement / primary hero). */
export async function PUT(request: Request) {
  const session = await requirePermission("content.write");
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = contentBlockFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const block = await upsertContentBlock(parsed.data);
  await logActivity(session.user.id, "content.update", "ContentBlock", block.id, {
    key: parsed.data.key,
  });
  return NextResponse.json({ block });
}

/** Create a new CMS block (FAQ, banner, blog, etc.). */
export async function POST(request: Request) {
  const session = await requirePermission("content.write");
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = cmsBlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  try {
    const block = await createCmsBlock(parsed.data, session.user.id);
    return NextResponse.json({ block }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create — key may already exist" },
      { status: 409 },
    );
  }
}
