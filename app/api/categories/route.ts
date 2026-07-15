import { NextResponse } from "next/server";
import { listCategories } from "@/lib/repositories/categories";

export async function GET() {
  const categories = await listCategories();
  return NextResponse.json({ categories });
}
