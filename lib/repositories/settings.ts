import { prisma } from "@/lib/db";
import {
  DEFAULT_MAX_LEAD_DAYS,
  DEFAULT_MIN_LEAD_DAYS,
} from "@/lib/delivery";
import type {
  DeliveryScheduleInput,
  PaymentAccountInput,
  SocialLinkInput,
} from "@/lib/validation/settings";
import { logActivity } from "@/lib/repositories/admin/activity";

const WHATSAPP_KEY = "whatsapp.number";

export async function getSetting(key: string) {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  return row?.value ?? null;
}

export async function setSetting(
  key: string,
  value: string,
  userId: string | null,
) {
  const row = await prisma.siteSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  await logActivity(userId, "setting.update", "SiteSetting", key, { value });
  return row;
}

export async function getWhatsAppNumber() {
  return getSetting(WHATSAPP_KEY);
}

export async function setWhatsAppNumber(number: string, userId: string | null) {
  return setSetting(WHATSAPP_KEY, number, userId);
}

export async function listPaymentAccounts(activeOnly = false) {
  return prisma.paymentAccount.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getPaymentAccountBySlug(slug: string) {
  return prisma.paymentAccount.findFirst({
    where: { slug, isActive: true },
  });
}

export async function createPaymentAccount(
  input: PaymentAccountInput,
  userId: string | null,
) {
  const row = await prisma.paymentAccount.create({
    data: {
      name: input.name,
      slug: input.slug,
      accountTitle: input.accountTitle,
      accountNumber: input.accountNumber,
      iconKey: input.iconKey,
      instructions: input.instructions || null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "payment_account.create", "PaymentAccount", row.id);
  return row;
}

export async function updatePaymentAccount(
  id: string,
  input: PaymentAccountInput,
  userId: string | null,
) {
  const row = await prisma.paymentAccount.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      accountTitle: input.accountTitle,
      accountNumber: input.accountNumber,
      iconKey: input.iconKey,
      instructions: input.instructions || null,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    },
  });
  await logActivity(userId, "payment_account.update", "PaymentAccount", id);
  return row;
}

export async function deletePaymentAccount(id: string, userId: string | null) {
  await prisma.paymentAccount.delete({ where: { id } });
  await logActivity(userId, "payment_account.delete", "PaymentAccount", id);
}

export async function listSocialLinks(enabledOnly = false) {
  return prisma.socialLink.findMany({
    where: enabledOnly ? { isEnabled: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { platform: "asc" }],
  });
}

export async function upsertSocialLink(
  input: SocialLinkInput,
  userId: string | null,
) {
  const row = await prisma.socialLink.upsert({
    where: { platform: input.platform },
    update: {
      url: input.url,
      sortOrder: input.sortOrder,
      isEnabled: input.isEnabled,
    },
    create: {
      platform: input.platform,
      url: input.url,
      sortOrder: input.sortOrder,
      isEnabled: input.isEnabled,
    },
  });
  await logActivity(userId, "social_link.upsert", "SocialLink", row.id, {
    platform: input.platform,
  });
  return row;
}

export async function deleteSocialLink(id: string, userId: string | null) {
  await prisma.socialLink.delete({ where: { id } });
  await logActivity(userId, "social_link.delete", "SocialLink", id);
}

export async function getMaintenanceSettings() {
  const [enabled, message] = await Promise.all([
    getSetting("maintenance.enabled"),
    getSetting("maintenance.message"),
  ]);
  return {
    enabled: enabled === "true",
    message:
      message ??
      "We're preparing today's stems — back shortly.",
  };
}

export async function setMaintenanceSettings(
  input: { enabled: boolean; message: string },
  userId: string | null,
) {
  await setSetting("maintenance.enabled", String(input.enabled), userId);
  await setSetting("maintenance.message", input.message, userId);
}

export async function getFeatureFlags() {
  const [builder, reviews, newsletter] = await Promise.all([
    getSetting("feature.builder"),
    getSetting("feature.reviews"),
    getSetting("feature.newsletter"),
  ]);
  return {
    builder: builder !== "false",
    reviews: reviews !== "false",
    newsletter: newsletter !== "false",
  };
}

export async function setFeatureFlags(
  input: { builder: boolean; reviews: boolean; newsletter: boolean },
  userId: string | null,
) {
  await setSetting("feature.builder", String(input.builder), userId);
  await setSetting("feature.reviews", String(input.reviews), userId);
  await setSetting("feature.newsletter", String(input.newsletter), userId);
}

export async function getDeliveryScheduleSettings() {
  const [minLead, maxLead] = await Promise.all([
    getSetting("delivery.min_lead_days"),
    getSetting("delivery.max_lead_days"),
  ]);
  const parsedMin = minLead != null ? Number(minLead) : DEFAULT_MIN_LEAD_DAYS;
  const parsedMax = maxLead != null ? Number(maxLead) : DEFAULT_MAX_LEAD_DAYS;
  const minLeadDays = Number.isFinite(parsedMin)
    ? Math.max(0, Math.min(14, Math.trunc(parsedMin)))
    : DEFAULT_MIN_LEAD_DAYS;
  const maxLeadDays = Number.isFinite(parsedMax)
    ? Math.max(1, Math.min(90, Math.trunc(parsedMax)))
    : DEFAULT_MAX_LEAD_DAYS;
  return {
    minLeadDays,
    maxLeadDays: Math.max(maxLeadDays, minLeadDays || 1),
    sameDayDelivery: minLeadDays === 0,
  };
}

export async function setDeliveryScheduleSettings(
  input: DeliveryScheduleInput,
  userId: string | null,
) {
  const minLeadDays = input.sameDayDelivery ? 0 : 1;
  const maxLeadDays = Math.max(input.maxLeadDays, minLeadDays || 1);
  await setSetting("delivery.min_lead_days", String(minLeadDays), userId);
  await setSetting("delivery.max_lead_days", String(maxLeadDays), userId);
  return { minLeadDays, maxLeadDays, sameDayDelivery: minLeadDays === 0 };
}
