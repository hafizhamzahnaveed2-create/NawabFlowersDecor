import { NextResponse } from "next/server";
import { z } from "zod";
import { listProducts } from "@/lib/repositories/products";

const querySchema = z.object({
  category: z.string().optional(),
  sub: z.string().optional(),
  type: z.enum(["BOUQUET", "RAW_MATERIAL", "ADDON", "SERVICE"]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  onSale: z.coerce.boolean().optional(),
  tags: z.string().optional(), // comma-separated tag slugs
  sort: z.enum(["newest", "price-asc", "price-desc", "best-selling"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const q = parsed.data;

  const result = await listProducts({
    categorySlug: q.category,
    subCategorySlug: q.sub,
    type: q.type,
    minPrice: q.minPrice,
    maxPrice: q.maxPrice,
    inStockOnly: q.inStock,
    onSaleOnly: q.onSale,
    tagSlugs: q.tags?.split(",").filter(Boolean),
    sort: q.sort,
    page: q.page,
  });

  return NextResponse.json(result);
}
