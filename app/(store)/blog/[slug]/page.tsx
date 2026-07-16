import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedBlogPost } from "@/lib/repositories/content";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  return {
    title: post?.title ?? "Journal",
    description:
      typeof post?.data?.excerpt === "string"
        ? post.data.excerpt
        : post?.body?.slice(0, 160),
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/blog"
        className="text-sm font-medium text-sage hover:text-burgundy"
      >
        ← Journal
      </Link>
      <h1 className="mt-4 font-display text-4xl text-burgundy">
        {post.title}
      </h1>
      {post.imageUrl && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-petal bg-stone/40">
          <Image
            src={post.imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            unoptimized={!post.imageUrl.includes("images.unsplash.com")}
          />
        </div>
      )}
      {post.body && (
        <div className="mt-8 whitespace-pre-line text-lg leading-relaxed text-ink/80">
          {post.body}
        </div>
      )}
    </article>
  );
}
