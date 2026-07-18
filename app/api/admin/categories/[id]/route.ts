import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  deleteCategory,
  deleteSubCategory,
  updateCategory,
  updateSubCategory,
} from "@/lib/repositories/admin/categories";
import {
  categorySchema,
  subCategorySchema,
} from "@/lib/validation/categories";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("catalog.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (body?.kind === "category") {
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    try {
      const category = await updateCategory(id, parsed.data, session.user.id);
      return NextResponse.json({ category });
    } catch {
      return NextResponse.json(
        { error: "Could not update — slug may already exist" },
        { status: 409 },
      );
    }
  }
  if (body?.kind === "subcategory") {
    const parsed = subCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid sub-category" },
        { status: 400 },
      );
    }
    try {
      const subCategory = await updateSubCategory(
        id,
        parsed.data,
        session.user.id,
      );
      return NextResponse.json({ subCategory });
    } catch {
      return NextResponse.json(
        { error: "Could not update — slug may already exist" },
        { status: 409 },
      );
    }
  }
  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requirePermission("catalog.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") ?? "category";
  try {
    if (kind === "subcategory") {
      await deleteSubCategory(id, session.user.id);
    } else {
      await deleteCategory(id, session.user.id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Could not delete",
      },
      { status: 400 },
    );
  }
}
