import { NextResponse } from "next/server";
import { listActiveBuilderComponents } from "@/lib/repositories/builder";

export async function GET() {
  const components = await listActiveBuilderComponents();
  return NextResponse.json({ components });
}
