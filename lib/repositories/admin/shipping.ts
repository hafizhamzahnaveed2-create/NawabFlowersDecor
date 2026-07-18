import { prisma } from "@/lib/db";
import type {
  DeliveryZoneInput,
  TaxRuleInput,
} from "@/lib/validation/shipping";
import { logActivity } from "@/lib/repositories/admin/activity";

function normArea(area?: string | null) {
  const t = area?.trim();
  return t ? t : null;
}

export async function listDeliveryZones() {
  const rows = await prisma.deliveryZone.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((z) => ({
    ...z,
    fee: Number(z.fee),
  }));
}

export async function listTaxRules() {
  const rows = await prisma.taxRule.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map((r) => ({
    ...r,
    ratePercent: Number(r.ratePercent),
  }));
}

export async function createDeliveryZone(
  input: DeliveryZoneInput,
  userId: string,
) {
  const row = await prisma.deliveryZone.create({
    data: {
      name: input.name,
      city: input.city,
      area: normArea(input.area),
      fee: input.fee,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "delivery_zone.create", "DeliveryZone", row.id);
  return { ...row, fee: Number(row.fee) };
}

export async function updateDeliveryZone(
  id: string,
  input: DeliveryZoneInput,
  userId: string,
) {
  const row = await prisma.deliveryZone.update({
    where: { id },
    data: {
      name: input.name,
      city: input.city,
      area: normArea(input.area),
      fee: input.fee,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "delivery_zone.update", "DeliveryZone", id);
  return { ...row, fee: Number(row.fee) };
}

export async function deleteDeliveryZone(id: string, userId: string) {
  await prisma.deliveryZone.delete({ where: { id } });
  await logActivity(userId, "delivery_zone.delete", "DeliveryZone", id);
}

export async function createTaxRule(input: TaxRuleInput, userId: string) {
  const row = await prisma.taxRule.create({
    data: {
      name: input.name,
      ratePercent: input.ratePercent,
      city: normArea(input.city),
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "tax_rule.create", "TaxRule", row.id);
  return { ...row, ratePercent: Number(row.ratePercent) };
}

export async function updateTaxRule(
  id: string,
  input: TaxRuleInput,
  userId: string,
) {
  const row = await prisma.taxRule.update({
    where: { id },
    data: {
      name: input.name,
      ratePercent: input.ratePercent,
      city: normArea(input.city),
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "tax_rule.update", "TaxRule", id);
  return { ...row, ratePercent: Number(row.ratePercent) };
}

export async function deleteTaxRule(id: string, userId: string) {
  await prisma.taxRule.delete({ where: { id } });
  await logActivity(userId, "tax_rule.delete", "TaxRule", id);
}
