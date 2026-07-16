import { prisma } from "@/lib/db";

export type DateRange = { from: Date; to: Date };

/** Inclusive UTC date-only range. Defaults to last 30 days. */
export function resolveAnalyticsRange(from?: string, to?: string): DateRange {
  const now = new Date();
  const endDay = to
    ? new Date(`${to}T00:00:00.000Z`)
    : new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
  const startDay = from
    ? new Date(`${from}T00:00:00.000Z`)
    : new Date(endDay.getTime() - 29 * 24 * 60 * 60 * 1000);

  const toExclusive = new Date(endDay);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);

  return { from: startDay, to: toExclusive };
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function rangeLabels(range: DateRange) {
  const endInclusive = new Date(range.to);
  endInclusive.setUTCDate(endInclusive.getUTCDate() - 1);
  return {
    from: toDateInput(range.from),
    to: toDateInput(endInclusive),
  };
}

export async function getAnalyticsSummary(range: DateRange) {
  const orderWhere = {
    createdAt: { gte: range.from, lt: range.to },
    status: { not: "CANCELLED" as const },
  };

  const [
    aggregate,
    statusGroups,
    topProductsRaw,
    dailyRaw,
    abandonedTotal,
    abandonedRecovered,
    newsletterNew,
    newsletterUnsub,
    repeatCustomers,
    guestOrders,
    registeredOrders,
    couponOrders,
    funnel,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: orderWhere,
      _sum: { total: true, discountAmount: true },
      _count: true,
      _avg: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: range.from, lt: range.to } },
      _count: { _all: true },
    }),
    prisma.$queryRaw<
      { productId: string; name: string; units: bigint; revenue: unknown }[]
    >`
      SELECT oi."productId" AS "productId",
             COALESCE(MAX(p.name), MAX(oi."nameSnapshot")) AS name,
             SUM(oi.quantity)::bigint AS units,
             COALESCE(SUM(oi."lineTotal"), 0) AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON p.id = oi."productId"
      WHERE o."createdAt" >= ${range.from}
        AND o."createdAt" < ${range.to}
        AND o.status <> 'CANCELLED'
        AND oi."productId" IS NOT NULL
      GROUP BY oi."productId"
      ORDER BY revenue DESC
      LIMIT 8
    `,
    prisma.$queryRaw<{ day: Date; order_count: number; revenue: unknown }[]>`
      SELECT day, order_count, revenue
      FROM analytics_daily_orders
      WHERE day >= ${range.from}::date
        AND day < ${range.to}::date
      ORDER BY day ASC
    `,
    prisma.abandonedCart.count({
      where: { createdAt: { gte: range.from, lt: range.to } },
    }),
    prisma.abandonedCart.count({
      where: {
        createdAt: { gte: range.from, lt: range.to },
        recoveredAt: { not: null },
      },
    }),
    prisma.newsletterSubscriber.count({
      where: { subscribedAt: { gte: range.from, lt: range.to } },
    }),
    prisma.newsletterSubscriber.count({
      where: {
        unsubscribedAt: { gte: range.from, lt: range.to },
      },
    }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM (
        SELECT o."userId"
        FROM "Order" o
        WHERE o."userId" IS NOT NULL
          AND o.status <> 'CANCELLED'
          AND o."createdAt" >= ${range.from}
          AND o."createdAt" < ${range.to}
        GROUP BY o."userId"
        HAVING COUNT(*) >= 2
      ) t
    `,
    prisma.order.count({
      where: {
        ...orderWhere,
        userId: null,
      },
    }),
    prisma.order.count({
      where: {
        ...orderWhere,
        userId: { not: null },
      },
    }),
    prisma.order.count({
      where: {
        ...orderWhere,
        couponId: { not: null },
      },
    }),
    prisma.$queryRaw<{ kind: string; cnt: bigint }[]>`
      SELECT kind, COUNT(*)::bigint AS cnt
      FROM "StoreEvent"
      WHERE "createdAt" >= ${range.from}
        AND "createdAt" < ${range.to}
        AND kind IN ('page_view', 'product_view', 'add_to_cart', 'checkout_start')
      GROUP BY kind
    `,
  ]);

  const orders = aggregate._count;
  const revenue = Number(aggregate._sum.total ?? 0);
  const discounts = Number(aggregate._sum.discountAmount ?? 0);
  const aov = orders > 0 ? revenue / orders : 0;

  const funnelMap = Object.fromEntries(
    funnel.map((f) => [f.kind, Number(f.cnt)]),
  ) as Record<string, number>;

  const pageViews = funnelMap.page_view ?? 0;
  const productViews = funnelMap.product_view ?? 0;
  const addToCarts = funnelMap.add_to_cart ?? 0;
  const checkoutStarts = funnelMap.checkout_start ?? 0;
  const conversionRate =
    pageViews > 0 ? (orders / pageViews) * 100 : null;

  return {
    orders,
    revenue,
    discounts,
    aov,
    avgOrder: Number(aggregate._avg.total ?? 0),
    statusMix: statusGroups.map((g) => ({
      status: g.status,
      count: g._count._all,
    })),
    topProducts: topProductsRaw.map((r) => ({
      productId: r.productId,
      name: r.name,
      units: Number(r.units),
      revenue: Number(r.revenue),
    })),
    daily: dailyRaw.map((d) => ({
      day: d.day instanceof Date ? d.day.toISOString().slice(0, 10) : String(d.day),
      orders: Number(d.order_count),
      revenue: Number(d.revenue),
    })),
    retention: {
      abandonedCarts: abandonedTotal,
      abandonedRecovered,
      recoveryRate:
        abandonedTotal > 0
          ? (abandonedRecovered / abandonedTotal) * 100
          : null,
      newsletterNew,
      newsletterUnsub,
      repeatCustomers: Number(repeatCustomers[0]?.count ?? 0),
      guestOrders,
      registeredOrders,
      couponOrders,
      couponRate: orders > 0 ? (couponOrders / orders) * 100 : null,
    },
    funnel: {
      pageViews,
      productViews,
      addToCarts,
      checkoutStarts,
      orders,
      conversionRate,
    },
  };
}

/** Top clicked CTA labels from event meta (heatmap-lite). */
export async function getTopCtaClicks(range: DateRange, limit = 10) {
  const rows = await prisma.$queryRaw<
    { label: string; cnt: bigint }[]
  >`
    SELECT COALESCE(meta->>'label', meta->>'selector', path, 'unknown') AS label,
           COUNT(*)::bigint AS cnt
    FROM "StoreEvent"
    WHERE kind = 'cta_click'
      AND "createdAt" >= ${range.from}
      AND "createdAt" < ${range.to}
    GROUP BY 1
    ORDER BY cnt DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ label: r.label, count: Number(r.cnt) }));
}
