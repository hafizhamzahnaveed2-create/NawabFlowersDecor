import { prisma } from "@/lib/db";
import type { ContentBlockFormInput } from "@/lib/validation/admin";
import type { CmsBlockInput } from "@/lib/validation/cms";
import { Prisma, type ContentBlockKind } from "@/lib/generated/prisma/client";
import { logActivity } from "@/lib/repositories/admin/activity";

const LEGACY_KINDS: Record<ContentBlockFormInput["key"], ContentBlockKind> = {
  "home.hero": "HERO_SLIDE",
  "announcement.main": "ANNOUNCEMENT",
  "announcement.ticker": "ANNOUNCEMENT",
};

export type EditableBlockKey = ContentBlockFormInput["key"];

export type ContentBlockDto = {
  id: string;
  kind: ContentBlockKind;
  key: string;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  data: Record<string, unknown> | null;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: Date;
};

function toDto(row: {
  id: string;
  kind: ContentBlockKind;
  key: string;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  data: Prisma.JsonValue | null;
  sortOrder: number;
  isPublished: boolean;
  updatedAt: Date;
}): ContentBlockDto {
  return {
    id: row.id,
    kind: row.kind,
    key: row.key,
    title: row.title,
    body: row.body,
    imageUrl: row.imageUrl,
    linkUrl: row.linkUrl,
    data:
      row.data && typeof row.data === "object" && !Array.isArray(row.data)
        ? (row.data as Record<string, unknown>)
        : null,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    updatedAt: row.updatedAt,
  };
}

/** Single published block by exact key (legacy helper). */
export async function getPublishedBlock(key: string) {
  const row = await prisma.contentBlock.findFirst({
    where: { key, isPublished: true },
  });
  return row ? toDto(row) : null;
}

export async function listPublishedByKind(kind: ContentBlockKind) {
  const rows = await prisma.contentBlock.findMany({
    where: { kind, isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(toDto);
}

export async function getPublishedByKey(key: string) {
  return getPublishedBlock(key);
}

/** Blog posts are SECTION blocks with key `blog.{slug}`. */
export async function listPublishedBlogPosts() {
  const rows = await prisma.contentBlock.findMany({
    where: {
      kind: "SECTION",
      isPublished: true,
      key: { startsWith: "blog." },
    },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(toDto);
}

export async function getPublishedBlogPost(slug: string) {
  return getPublishedBlock(`blog.${slug}`);
}

export async function getPublishedPolicy(slug: string) {
  return getPublishedBlock(`policy.${slug}`);
}

export async function getBlocksForAdmin() {
  const blocks = await prisma.contentBlock.findMany({
    where: { key: { in: Object.keys(LEGACY_KINDS) } },
    select: {
      key: true,
      title: true,
      body: true,
      imageUrl: true,
      linkUrl: true,
      data: true,
      isPublished: true,
      updatedAt: true,
    },
  });
  return new Map(
    blocks.map((b) => [
      b.key,
      {
        ...b,
        data:
          b.data && typeof b.data === "object" && !Array.isArray(b.data)
            ? (b.data as Record<string, unknown>)
            : null,
      },
    ]),
  );
}

export async function listBlocksByKindForAdmin(kind: ContentBlockKind) {
  const rows = await prisma.contentBlock.findMany({
    where: { kind },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map(toDto);
}

export async function listAllBlocksForAdmin() {
  const rows = await prisma.contentBlock.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
  });
  return rows.map(toDto);
}

export async function upsertContentBlock(input: ContentBlockFormInput) {
  const existing = await prisma.contentBlock.findUnique({
    where: { key: input.key },
    select: { data: true },
  });
  const prev =
    existing?.data &&
    typeof existing.data === "object" &&
    !Array.isArray(existing.data)
      ? (existing.data as Record<string, unknown>)
      : {};
  const data: Record<string, unknown> = { ...prev };
  if (input.videoUrl) {
    data.videoUrl = input.videoUrl;
  } else {
    delete data.videoUrl;
  }
  const dataValue =
    Object.keys(data).length > 0
      ? (data as Prisma.InputJsonValue)
      : Prisma.JsonNull;

  return prisma.contentBlock.upsert({
    where: { key: input.key },
    update: {
      title: input.title || null,
      body: input.body || null,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      isPublished: input.isPublished,
      data: dataValue,
    },
    create: {
      key: input.key,
      kind: LEGACY_KINDS[input.key],
      title: input.title || null,
      body: input.body || null,
      imageUrl: input.imageUrl,
      linkUrl: input.linkUrl,
      isPublished: input.isPublished,
      data: dataValue === Prisma.JsonNull ? undefined : dataValue,
    },
  });
}

export async function createCmsBlock(
  input: CmsBlockInput,
  userId: string | null,
) {
  const row = await prisma.contentBlock.create({
    data: {
      kind: input.kind,
      key: input.key,
      title: input.title || null,
      body: input.body || null,
      imageUrl: input.imageUrl ?? null,
      linkUrl: input.linkUrl ?? null,
      sortOrder: input.sortOrder,
      isPublished: input.isPublished,
      data: (input.data ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
  await logActivity(userId, "content.create", "ContentBlock", row.id, {
    key: row.key,
    kind: row.kind,
  });
  return toDto(row);
}

export async function updateCmsBlock(
  id: string,
  input: CmsBlockInput,
  userId: string | null,
) {
  const row = await prisma.contentBlock.update({
    where: { id },
    data: {
      kind: input.kind,
      key: input.key,
      title: input.title || null,
      body: input.body || null,
      imageUrl: input.imageUrl ?? null,
      linkUrl: input.linkUrl ?? null,
      sortOrder: input.sortOrder,
      isPublished: input.isPublished,
      data:
        input.data === null
          ? Prisma.JsonNull
          : ((input.data ?? undefined) as Prisma.InputJsonValue | undefined),
    },
  });
  await logActivity(userId, "content.update", "ContentBlock", row.id, {
    key: row.key,
  });
  return toDto(row);
}

export async function deleteCmsBlock(id: string, userId: string | null) {
  const row = await prisma.contentBlock.delete({ where: { id } });
  await logActivity(userId, "content.delete", "ContentBlock", id, {
    key: row.key,
  });
}
