import { prisma } from "@/lib/db";

function utcToday(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function getDashboardData() {
  const today = utcToday();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const weekAhead = new Date(today);
  weekAhead.setUTCDate(weekAhead.getUTCDate() + 7);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

  const [
    todaysDeliveries,
    upcomingCount,
    pendingCount,
    monthAggregate,
    lowStock,
    recentOrders,
  ] = await Promise.all([
    prisma.order.findMany({
      where: {
        deliveryDate: { gte: today, lt: tomorrow },
        status: { notIn: ["CANCELLED", "DELIVERED"] },
      },
      orderBy: { deliveryTimeSlot: "asc" },
      select: {
        id: true,
        orderNumber: true,
        deliveryTimeSlot: true,
        recipientName: true,
        city: true,
        area: true,
        status: true,
      },
    }),
    prisma.order.count({
      where: {
        deliveryDate: { gte: tomorrow, lt: weekAhead },
        status: { notIn: ["CANCELLED", "DELIVERED"] },
      },
    }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({
      where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      orderBy: { stock: "asc" },
      take: 6,
      select: { id: true, name: true, stock: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        recipientName: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    todaysDeliveries,
    upcomingCount,
    pendingCount,
    monthRevenue: Number(monthAggregate._sum.total ?? 0),
    monthOrders: monthAggregate._count,
    lowStock,
    recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
  };
}
