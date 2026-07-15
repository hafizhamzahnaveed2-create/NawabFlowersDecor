import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { productFormSchema } from "@/lib/validation/admin";
import {
  deleteProduct,
  updateProduct,
} from "@/lib/repositories/admin/products";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = productFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const product = await updateProduct(id, parsed.data, session.user.id);
  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  await deleteProduct(id, session.user.id);
  return NextResponse.json({ ok: true });
}
