import { prisma } from "@/lib/db";
import type {
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
