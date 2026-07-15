import { prisma } from "@/lib/db";
import type { ContentBlockFormInput } from "@/lib/validation/admin";
import type { ContentBlockKind } from "@/lib/generated/prisma/client";

// The two CMS-editable blocks in the admin MVP. More kinds (banners,
// testimonials, FAQs, blog) arrive in Phase 6.
const BLOCK_KINDS: Record<ContentBlockFormInput["key"], ContentBlockKind> = {
  "home.hero": "HERO_SLIDE",
  "announcement.main": "ANNOUNCEMENT",
};

export type EditableBlockKey = ContentBlockFormInput["key"];

export async function getPublishedBlock(key: EditableBlockKey) {
  return prisma.contentBlock.findFirst({
    where: { key, isPublished: true },
    select: { title: true, body: true, imageUrl: true, linkUrl: true },
  });
}

export async function getBlocksForAdmin() {
  const blocks = await prisma.contentBlock.findMany({
    where: { key: { in: Object.keys(BLOCK_KINDS) } },
    select: {
      key: true,
      title: true,
      body: true,
      imageUrl: true,
      linkUrl: true,
      isPublished: true,
      updatedAt: true,
    },
  });
  return new Map(blocks.map((b) => [b.key, b]));
}

export async function upsertContentBlock(input: ContentBlockFormInput) {
  return prisma.contentBlock.upsert({
    where: { key: input.key },
    update: {
      title: input.title || null,
      body: input.body || null,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      isPublished: input.isPublished,
    },
    create: {
      key: input.key,
      kind: BLOCK_KINDS[input.key],
      title: input.title || null,
      body: input.body || null,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      isPublished: input.isPublished,
    },
  });
}
