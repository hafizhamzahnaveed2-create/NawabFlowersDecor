import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-helpers";
import {
  analyticsRangeSchema,
  exportTypeSchema,
} from "@/lib/validation/analytics";
import { resolveAnalyticsRange } from "@/lib/repositories/admin/analytics";
import {
  exportNewsletterCsv,
  exportOrdersCsv,
  exportProductsCsv,
} from "@/lib/repositories/admin/exports";

export async function GET(request: Request) {
  const session = await requirePermission("analytics.read");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const typeParsed = exportTypeSchema.safeParse(url.searchParams.get("type"));
  if (!typeParsed.success) {
    return NextResponse.json(
      { error: "type must be orders, products, or newsletter" },
      { status: 400 },
    );
  }

  const rangeParsed = analyticsRangeSchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  const range = resolveAnalyticsRange(
    rangeParsed.success ? rangeParsed.data.from : undefined,
    rangeParsed.success ? rangeParsed.data.to : undefined,
  );

  let csv: string;
  let filename: string;
  switch (typeParsed.data) {
    case "orders":
      csv = await exportOrdersCsv(range);
      filename = `orders-${range.from.toISOString().slice(0, 10)}.csv`;
      break;
    case "products":
      csv = await exportProductsCsv(range);
      filename = `products-${range.from.toISOString().slice(0, 10)}.csv`;
      break;
    case "newsletter":
      csv = await exportNewsletterCsv();
      filename = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
      break;
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
