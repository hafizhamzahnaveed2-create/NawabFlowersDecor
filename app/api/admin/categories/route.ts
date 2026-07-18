import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  createCategory,
  createSubCategory,
  listCategoriesForAdmin,
} from "@/lib/repositories/admin/categories";
import {
  categorySchema,
  subCategorySchema,
} from "@/lib/validation/categories";

export async function GET() {
  const session = await requirePermission("catalog.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const categories = await listCategoriesForAdmin();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  const session = await requirePermission("catalog.write");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  if (body?.kind === "category") {
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    try {
      const category = await createCategory(parsed.data, session.user.id);
      return NextResponse.json({ category }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "Could not create — slug may already exist" },
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
      const subCategory = await createSubCategory(parsed.data, session.user.id);
      return NextResponse.json({ subCategory }, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "Could not create — slug may already exist" },
        { status: 409 },
      );
    }
  }
  return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
}
