import { prisma } from "@/lib/db";
import type { CouponFormInput } from "@/lib/validation/growth";
import { logActivity } from "@/lib/repositories/admin/activity";

export class CouponError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export type CouponDto = {
  id: string;
  code: string;
  kind: "PERCENT" | "FIXED";
  value: number;
  minOrderAmount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
};

function toDto(c: {
  id: string;
  code: string;
  kind: "PERCENT" | "FIXED";
  value: { toString(): string } | number;
  minOrderAmount: { toString(): string } | number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
}): CouponDto {
  return {
    id: c.id,
    code: c.code,
    kind: c.kind,
    value: Number(c.value),
    minOrderAmount:
      c.minOrderAmount == null ? null : Number(c.minOrderAmount),
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    maxRedemptions: c.maxRedemptions,
    redemptionCount: c.redemptionCount,
    isActive: c.isActive,
  };
}

export function computeDiscount(
  coupon: CouponDto,
  subtotal: number,
): number {
  if (coupon.kind === "PERCENT") {
    return Math.min(subtotal, Math.round((subtotal * coupon.value) / 100));
  }
  return Math.min(subtotal, coupon.value);
}

/** Validate a coupon code against the current cart subtotal. */
export async function validateCoupon(code: string, subtotal: number) {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!coupon || !coupon.isActive) {
    throw new CouponError("That promo code isn’t valid");
  }
  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) {
    throw new CouponError("That promo code isn’t active yet");
  }
  if (coupon.endsAt && now > coupon.endsAt) {
    throw new CouponError("That promo code has expired");
  }
  if (
    coupon.maxRedemptions != null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    throw new CouponError("That promo code has been fully redeemed");
  }
  const dto = toDto(coupon);
  if (dto.minOrderAmount != null && subtotal < dto.minOrderAmount) {
    throw new CouponError(
      `This code needs a minimum order of Rs ${dto.minOrderAmount}`,
    );
  }
  const discount = computeDiscount(dto, subtotal);
  return { coupon: dto, discount };
}

export async function listCoupons() {
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toDto);
}

export async function createCoupon(
  input: CouponFormInput,
  userId: string | null,
) {
  const row = await prisma.coupon.create({
    data: {
      code: input.code,
      kind: input.kind,
      value: input.value,
      minOrderAmount: input.minOrderAmount ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      maxRedemptions: input.maxRedemptions ?? null,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "coupon.create", "Coupon", row.id, {
    code: row.code,
  });
  return toDto(row);
}

export async function updateCoupon(
  id: string,
  input: CouponFormInput,
  userId: string | null,
) {
  const row = await prisma.coupon.update({
    where: { id },
    data: {
      code: input.code,
      kind: input.kind,
      value: input.value,
      minOrderAmount: input.minOrderAmount ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      maxRedemptions: input.maxRedemptions ?? null,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "coupon.update", "Coupon", row.id, {
    code: row.code,
  });
  return toDto(row);
}

export async function deleteCoupon(id: string, userId: string | null) {
  await prisma.coupon.delete({ where: { id } });
  await logActivity(userId, "coupon.delete", "Coupon", id);
}
