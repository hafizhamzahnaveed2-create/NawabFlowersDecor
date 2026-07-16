import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import { bouquetComponentSchema } from "@/lib/validation/builder";
import {
  createBuilderComponent,
  listAdminBuilderComponents,
} from "@/lib/repositories/builder";

export async function GET() {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const components = await listAdminBuilderComponents();
  return NextResponse.json({ components });
}

export async function POST(request: Request) {
  const session = await requireStaff();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bouquetComponentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const component = await createBuilderComponent(
    parsed.data,
    session.user.id,
  );
  return NextResponse.json({ component }, { status: 201 });
}
