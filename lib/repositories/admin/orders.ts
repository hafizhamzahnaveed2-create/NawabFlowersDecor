import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/generated/prisma/client";
import { logActivity } from "@/lib/repositories/admin/activity";

export async function listAdminOrders(options: {
  status?: OrderStatus;
  search?: string;
  page?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = 20;

  const where = {
    ...(options.status ? { status: options.status } : {}),
    ...(options.search
      ? {
          OR: [
            { orderNumber: { contains: options.search, mode: "insensitive" as const } },
            { recipientName: { contains: options.search, mode: "insensitive" as const } },
            { recipientPhone: { contains: options.search } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      // Fulfilment view: soonest deliveries first.
      orderBy: [{ deliveryDate: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        total: true,
        deliveryDate: true,
        deliveryTimeSlot: true,
        recipientName: true,
        city: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: rows.map((o) => ({
      ...o,
      total: Number(o.total),
      itemCount: o._count.items,
    })),
    total,
    page,
    pageCount: Math.ceil(total / pageSize),
  };
}

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
            },
          },
          customBouquet: {
            include: { items: true },
          },
        },
      },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    customerName: order.user?.name ?? null,
    customerEmail: order.user?.email ?? order.guestEmail,
    subtotal: Number(order.subtotal),
    discountAmount: Number(order.discountAmount),
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
    deliveryDate: order.deliveryDate,
    deliveryTimeSlot: order.deliveryTimeSlot,
    giftMessage: order.giftMessage,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    city: order.city,
    area: order.area,
    postalCode: order.postalCode,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      nameSnapshot: item.nameSnapshot,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      imageUrl: item.product?.images[0]?.url ?? null,
      // Custom bouquet breakdown (Phase 4 will populate these)
      customComponents:
        item.customBouquet?.items.map((c) => ({
          name: c.componentName,
          quantity: c.quantity,
          unitPrice: Number(c.unitPrice),
        })) ?? null,
    })),
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  actorId: string,
) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { status },
    select: { id: true, orderNumber: true, status: true },
  });
  await logActivity(actorId, "order.status_change", "Order", orderId, {
    orderNumber: order.orderNumber,
    status,
  });
  return order;
}
