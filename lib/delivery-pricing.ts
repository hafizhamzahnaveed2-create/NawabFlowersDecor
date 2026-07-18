import { prisma } from "@/lib/db";
import { DEFAULT_DELIVERY_FEE } from "@/lib/delivery";

function norm(value: string) {
  return value.trim().toLowerCase();
}

async function defaultDeliveryFee(): Promise<number> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: "delivery.default_fee" },
  });
  const n = row ? Number(row.value) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_DELIVERY_FEE;
}

/**
 * Most specific active zone wins: city+area match, then city-wide (area null).
 */
export async function resolveDeliveryFee(
  city: string,
  area?: string | null,
): Promise<{ fee: number; zoneName: string | null }> {
  const cityKey = norm(city);
  if (!cityKey) {
    return { fee: await defaultDeliveryFee(), zoneName: null };
  }

  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const areaKey = area ? norm(area) : "";
  const cityZones = zones.filter((z) => norm(z.city) === cityKey);

  if (areaKey) {
    const areaMatch = cityZones.find(
      (z) => z.area != null && norm(z.area) === areaKey,
    );
    if (areaMatch) {
      return { fee: Number(areaMatch.fee), zoneName: areaMatch.name };
    }
  }

  const cityWide = cityZones.find((z) => z.area == null || z.area.trim() === "");
  if (cityWide) {
    return { fee: Number(cityWide.fee), zoneName: cityWide.name };
  }

  return { fee: await defaultDeliveryFee(), zoneName: null };
}

/**
 * Apply the best matching tax rule: city-specific first, else global (city null).
 * Taxable base = max(0, subtotal - discount).
 */
export async function resolveTaxAmount(
  taxableBase: number,
  city: string,
): Promise<{ taxAmount: number; ratePercent: number; ruleName: string | null }> {
  const base = Math.max(0, taxableBase);
  const cityKey = norm(city);

  const rules = await prisma.taxRule.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const cityRule = rules.find((r) => r.city != null && norm(r.city) === cityKey);
  const globalRule = rules.find((r) => r.city == null || r.city.trim() === "");
  const rule = cityRule ?? globalRule;

  if (!rule) {
    return { taxAmount: 0, ratePercent: 0, ruleName: null };
  }

  const ratePercent = Number(rule.ratePercent);
  const taxAmount = Math.round(base * (ratePercent / 100));
  return { taxAmount, ratePercent, ruleName: rule.name };
}

export async function quoteCheckoutTotals(input: {
  subtotal: number;
  discountAmount?: number;
  city: string;
  area?: string | null;
}) {
  const discountAmount = Math.max(0, input.discountAmount ?? 0);
  const taxableBase = Math.max(0, input.subtotal - discountAmount);
  const [{ fee: deliveryFee, zoneName }, tax] = await Promise.all([
    resolveDeliveryFee(input.city, input.area),
    resolveTaxAmount(taxableBase, input.city),
  ]);
  const total = taxableBase + deliveryFee + tax.taxAmount;
  return {
    subtotal: input.subtotal,
    discountAmount,
    deliveryFee,
    deliveryZoneName: zoneName,
    taxAmount: tax.taxAmount,
    taxRatePercent: tax.ratePercent,
    taxRuleName: tax.ruleName,
    total,
  };
}
