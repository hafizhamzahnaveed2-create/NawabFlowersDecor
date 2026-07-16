import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/repositories/admin/activity";

export async function listApprovedReviews(productId: string) {
  const rows = await prisma.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.createdAt,
    authorName: r.user.name?.split(" ")[0] ?? "Customer",
  }));
}

export async function getReviewSummary(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return {
    average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
    count: agg._count.rating,
  };
}

export async function submitReview(
  userId: string,
  input: { productId: string; rating: number; title?: string; body?: string },
) {
  return prisma.review.upsert({
    where: {
      productId_userId: { productId: input.productId, userId },
    },
    update: {
      rating: input.rating,
      title: input.title || null,
      body: input.body || null,
      isApproved: false, // re-moderation on edit
    },
    create: {
      userId,
      productId: input.productId,
      rating: input.rating,
      title: input.title || null,
      body: input.body || null,
      isApproved: false,
    },
  });
}

export async function listPendingReviews() {
  return prisma.review.findMany({
    where: { isApproved: false },
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });
}

export async function setReviewApproval(
  id: string,
  isApproved: boolean,
  actorId: string | null,
) {
  if (!isApproved) {
    await prisma.review.delete({ where: { id } });
    await logActivity(actorId, "review.dismiss", "Review", id);
    return null;
  }
  const row = await prisma.review.update({
    where: { id },
    data: { isApproved: true },
  });
  await logActivity(actorId, "review.moderate", "Review", id, { isApproved: true });
  return row;
}
