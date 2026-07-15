import { prisma } from "@/lib/db";
import { effectivePrice } from "@/lib/pricing";
import {
  DELIVERY_FEE,
  earliestDeliveryDate,
  latestDeliveryDate,
  toDateInputValue,
} from "@/lib/delivery";
import type { CheckoutInput } from "@/lib/validation/checkout";

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const n = Math.floor(100000 + Math.random() * 900000);
  return `NF-${year}-${n}`;
}

/**
 * Creates an order from client cart input. The client's prices are never
 * trusted: every line is re-priced from the database, stock is checked and
 * decremented atomically inside a transaction.
 */
export async function createOrder(
  input: CheckoutInput,
  userId: string | null,
) {
  // Validate on the calendar-date string (ISO strings compare correctly),
  // then store as UTC midnight: the column is @db.Date and keeps the UTC
  // date portion — local-time parsing would shift the date back a day.
  if (
    input.deliveryDate < toDateInputValue(earliestDeliveryDate()) ||
    input.deliveryDate > toDateInputValue(latestDeliveryDate())
  ) {
    throw new CheckoutError(
      "Delivery date must be between tomorrow and 30 days from now",
    );
  }
  const deliveryDate = new Date(`${input.deliveryDate}T00:00:00Z`);
  if (!userId && !input.guestEmail) {
    throw new CheckoutError("Email is required for guest checkout");
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { variants: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  // Re-price and stock-check every line against the database.
  const lines = input.items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new CheckoutError("An item in your cart is no longer available");
    }
    if (item.variantId) {
      const variant = product.variants.find(
        (v) => v.id === item.variantId && v.isActive,
      );
      if (!variant) {
        throw new CheckoutError(
          `The selected option for “${product.name}” is no longer available`,
        );
      }
      if (variant.stock < item.quantity) {
        throw new CheckoutError(
          `Only ${variant.stock} of “${product.name} — ${variant.name}” left in stock`,
        );
      }
      const unitPrice = Number(variant.price);
      return {
        productId: product.id,
        variantId: variant.id,
        nameSnapshot: `${product.name} — ${variant.name}`,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
      };
    }
    if (product.stock < item.quantity) {
      throw new CheckoutError(
        `Only ${product.stock} of “${product.name}” left in stock`,
      );
    }
    const unitPrice = effectivePrice({
      price: Number(product.price),
      salePrice: product.salePrice == null ? null : Number(product.salePrice),
      saleStartsAt: product.saleStartsAt,
      saleEndsAt: product.saleEndsAt,
    });
    return {
      productId: product.id,
      variantId: null,
      nameSnapshot: product.name,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = subtotal + DELIVERY_FEE;

  return prisma.$transaction(async (tx) => {
    // Decrement stock with guards so two simultaneous checkouts can't oversell.
    for (const line of lines) {
      if (line.variantId) {
        const updated = await tx.productVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new CheckoutError(
            `“${line.nameSnapshot}” just sold out — please adjust your cart`,
          );
        }
      } else {
        const updated = await tx.product.updateMany({
          where: { id: line.productId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) {
          throw new CheckoutError(
            `“${line.nameSnapshot}” just sold out — please adjust your cart`,
          );
        }
      }
    }

    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        guestEmail: userId ? null : input.guestEmail || null,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod: input.paymentMethod,
        subtotal,
        discountAmount: 0,
        deliveryFee: DELIVERY_FEE,
        total,
        deliveryDate,
        deliveryTimeSlot: input.deliveryTimeSlot,
        giftMessage: input.giftMessage || null,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        addressLine1: input.addressLine1,
        addressLine2: input.addressLine2 || null,
        city: input.city,
        area: input.area || null,
        postalCode: input.postalCode || null,
        items: { create: lines },
      },
      select: { id: true, orderNumber: true, total: true },
    });
  });
}

export type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryDate: Date;
  deliveryTimeSlot: string;
  giftMessage: string | null;
  recipientName: string;
  recipientPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  area: string | null;
  createdAt: Date;
  items: {
    id: string;
    nameSnapshot: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    productSlug: string | null;
    imageUrl: string | null;
  }[];
};

export async function getOrderByNumber(
  orderNumber: string,
): Promise<OrderSummary | null> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
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
    subtotal: Number(order.subtotal),
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
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      nameSnapshot: item.nameSnapshot,
      unitPrice: Number(item.unitPrice),
      quantity: item.quantity,
      lineTotal: Number(item.lineTotal),
      productSlug: item.product?.slug ?? null,
      imageUrl: item.product?.images[0]?.url ?? null,
    })),
  };
}

export async function listOrdersForUser(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      deliveryDate: true,
      deliveryTimeSlot: true,
      createdAt: true,
      items: { select: { nameSnapshot: true, quantity: true } },
    },
  });
  return orders.map((o) => ({
    ...o,
    total: Number(o.total),
  }));
}
