import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import { productFormSchema } from "@/lib/validation/admin";
import { createProduct } from "@/lib/repositories/admin/products";

export async function POST(request: Request) {
  const session = await requirePermission("catalog.write");
  if (!session) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = productFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const product = await createProduct(parsed.data, session.user.id);
  return NextResponse.json({ product }, { status: 201 });
}
