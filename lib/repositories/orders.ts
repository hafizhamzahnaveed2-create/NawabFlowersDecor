import { prisma } from "@/lib/db";
import { effectivePrice } from "@/lib/pricing";
import {
  DELIVERY_FEE,
  earliestDeliveryDate,
  latestDeliveryDate,
  toDateInputValue,
} from "@/lib/delivery";
import type { CheckoutInput } from "@/lib/validation/checkout";
import {
  CouponError,
  validateCoupon,
} from "@/lib/repositories/coupons";
import {
  awardLoyaltyPoints,
  markCartRecovered,
} from "@/lib/repositories/retention";

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
 * trusted: catalog lines are re-priced from products; custom bouquets use
 * the snapshotted CustomBouquet total. Stock is decremented atomically.
 */
export async function createOrder(
  input: CheckoutInput,
  userId: string | null,
) {
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

  const productIds = [
    ...new Set(
      input.items
        .map((i) => i.productId)
        .filter((id): id is string => !!id),
    ),
  ];
  const customIds = [
    ...new Set(
      input.items
        .map((i) => i.customBouquetId)
        .filter((id): id is string => !!id),
    ),
  ];

  const [products, customBouquets] = await Promise.all([
    productIds.length
      ? prisma.product.findMany({
          where: { id: { in: productIds }, isActive: true },
          include: { variants: true },
        })
      : Promise.resolve([]),
    customIds.length
      ? prisma.customBouquet.findMany({
          where: { id: { in: customIds } },
          include: { items: true },
        })
      : Promise.resolve([]),
  ]);
  const productById = new Map(products.map((p) => [p.id, p]));
  const customById = new Map(customBouquets.map((c) => [c.id, c]));

  type OrderLine = {
    productId: string | null;
    variantId: string | null;
    customBouquetId: string | null;
    nameSnapshot: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    /** For stock decrement of builder components */
    componentDecrements?: { componentId: string; quantity: number }[];
  };

  const lines: OrderLine[] = input.items.map((item) => {
    if (item.customBouquetId) {
      const bouquet = customById.get(item.customBouquetId);
      if (!bouquet) {
        throw new CheckoutError(
          "A custom bouquet in your cart is no longer available",
        );
      }
      // Custom designs are sold as a single unit; quantity must be 1.
      if (item.quantity !== 1) {
        throw new CheckoutError("Custom bouquets can only be ordered once each");
      }
      const unitPrice = Number(bouquet.totalPrice);
      const label = bouquet.name
        ? `Custom bouquet — ${bouquet.name}`
        : "Custom bouquet";
      return {
        productId: null,
        variantId: null,
        customBouquetId: bouquet.id,
        nameSnapshot: label,
        unitPrice,
        quantity: 1,
        lineTotal: unitPrice,
        componentDecrements: bouquet.items
          .filter((i) => i.componentId)
          .map((i) => ({
            componentId: i.componentId!,
            quantity: i.quantity,
          })),
      };
    }

    const product = productById.get(item.productId!);
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
        customBouquetId: null,
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
      customBouquetId: null,
      nameSnapshot: product.name,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  let discountAmount = 0;
  let couponId: string | null = null;
  if (input.couponCode) {
    try {
      const { coupon, discount } = await validateCoupon(
        input.couponCode,
        subtotal,
      );
      discountAmount = discount;
      couponId = coupon.id;
    } catch (error) {
      if (error instanceof CouponError) throw new CheckoutError(error.message);
      throw error;
    }
  }

  const total = Math.max(0, subtotal - discountAmount) + DELIVERY_FEE;

  const order = await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      if (line.customBouquetId && line.componentDecrements) {
        for (const dec of line.componentDecrements) {
          const updated = await tx.bouquetComponent.updateMany({
            where: { id: dec.componentId, stock: { gte: dec.quantity } },
            data: { stock: { decrement: dec.quantity } },
          });
          if (updated.count === 0) {
            throw new CheckoutError(
              `A component in “${line.nameSnapshot}” just sold out — please rebuild it`,
            );
          }
          const component = await tx.bouquetComponent.findUnique({
            where: { id: dec.componentId },
            select: { productId: true },
          });
          if (component?.productId) {
            await tx.product.updateMany({
              where: {
                id: component.productId,
                stock: { gte: dec.quantity },
              },
              data: { stock: { decrement: dec.quantity } },
            });
          }
        }
        continue;
      }

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
      } else if (line.productId) {
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

    if (couponId) {
      await tx.coupon.update({
        where: { id: couponId },
        data: { redemptionCount: { increment: 1 } },
      });
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
        discountAmount,
        deliveryFee: DELIVERY_FEE,
        total,
        couponId,
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
        items: {
          create: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            customBouquetId: line.customBouquetId,
            nameSnapshot: line.nameSnapshot,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
            lineTotal: line.lineTotal,
          })),
        },
      },
      select: { id: true, orderNumber: true, total: true, accessToken: true },
    });
  });

  // Post-order retention hooks (best-effort; order already committed).
  const recoveryEmail = userId
    ? (await prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))
        ?.email
    : input.guestEmail || null;
  if (recoveryEmail) {
    await markCartRecovered(recoveryEmail).catch(() => undefined);
  }
  if (userId) {
    await awardLoyaltyPoints(userId, Number(order.total)).catch(() => undefined);
  }

  return order;
}

export type OrderSummary = {
  id: string;
  orderNumber: string;
  userId: string | null;
  accessToken: string;
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
          customBouquet: { select: { previewImageUrl: true } },
        },
      },
    },
  });
  if (!order) return null;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    accessToken: order.accessToken,
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
      imageUrl:
        item.product?.images[0]?.url ??
        item.customBouquet?.previewImageUrl ??
        null,
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
