import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCustomBouquetSchema } from "@/lib/validation/builder";
import {
  BuilderError,
  createCustomBouquet,
} from "@/lib/repositories/custom-bouquets";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createCustomBouquetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const session = await auth();

  try {
    const bouquet = await createCustomBouquet(
      parsed.data,
      session?.user?.id ?? null,
    );
    return NextResponse.json({ bouquet }, { status: 201 });
  } catch (error) {
    if (error instanceof BuilderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Custom bouquet create failed:", error);
    return NextResponse.json(
      { error: "Could not save your bouquet. Please try again." },
      { status: 500 },
    );
  }
}
