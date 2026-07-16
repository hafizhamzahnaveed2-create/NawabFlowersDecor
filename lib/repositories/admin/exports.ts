import { prisma } from "@/lib/db";
import type { DateRange } from "@/lib/repositories/admin/analytics";

function csvEscape(value: string | number | null | undefined) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  return lines.join("\n") + "\n";
}

export async function exportOrdersCsv(range: DateRange) {
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: range.from, lt: range.to } },
    orderBy: { createdAt: "desc" },
    select: {
      orderNumber: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      total: true,
      discountAmount: true,
      recipientName: true,
      city: true,
      guestEmail: true,
      user: { select: { email: true } },
      _count: { select: { items: true } },
    },
  });

  return toCsv(
    [
      "orderNumber",
      "createdAt",
      "status",
      "paymentStatus",
      "total",
      "discount",
      "items",
      "recipient",
      "city",
      "email",
    ],
    orders.map((o) => [
      o.orderNumber,
      o.createdAt.toISOString(),
      o.status,
      o.paymentStatus,
      Number(o.total),
      Number(o.discountAmount),
      o._count.items,
      o.recipientName,
      o.city,
      o.user?.email ?? o.guestEmail,
    ]),
  );
}

export async function exportProductsCsv(range: DateRange) {
  const rows = await prisma.$queryRaw<
    {
      slug: string | null;
      name: string;
      units: bigint;
      revenue: unknown;
    }[]
  >`
    SELECT p.slug,
           COALESCE(p.name, oi."nameSnapshot") AS name,
           SUM(oi.quantity)::bigint AS units,
           COALESCE(SUM(oi."lineTotal"), 0) AS revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    LEFT JOIN "Product" p ON p.id = oi."productId"
    WHERE o."createdAt" >= ${range.from}
      AND o."createdAt" < ${range.to}
      AND o.status <> 'CANCELLED'
    GROUP BY p.slug, COALESCE(p.name, oi."nameSnapshot")
    ORDER BY revenue DESC
  `;

  return toCsv(
    ["slug", "name", "unitsSold", "revenue"],
    rows.map((r) => [
      r.slug,
      r.name,
      Number(r.units),
      Number(r.revenue),
    ]),
  );
}

export async function exportNewsletterCsv() {
  const rows = await prisma.newsletterSubscriber.findMany({
    orderBy: { subscribedAt: "desc" },
    select: {
      email: true,
      isActive: true,
      subscribedAt: true,
      unsubscribedAt: true,
    },
  });

  return toCsv(
    ["email", "isActive", "subscribedAt", "unsubscribedAt"],
    rows.map((r) => [
      r.email,
      r.isActive ? "true" : "false",
      r.subscribedAt.toISOString(),
      r.unsubscribedAt?.toISOString() ?? "",
    ]),
  );
}
