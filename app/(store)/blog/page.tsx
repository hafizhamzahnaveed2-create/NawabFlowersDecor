import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublishedBlogPosts } from "@/lib/repositories/content";
import { canOptimizeImage } from "@/lib/images";

export const metadata: Metadata = { title: "Journal" };

export default async function BlogIndexPage() {
  const posts = await listPublishedBlogPosts();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="font-display text-4xl text-burgundy">Journal</h1>
      <p className="mt-2 text-ink/70">
        Occasions, care tips, and notes from the atelier.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 text-ink/60">No posts yet.</p>
      ) : (
        <ul className="mt-10 space-y-8">
          {posts.map((post) => {
            const slug = post.key.replace(/^blog\./, "");
            const excerpt =
              typeof post.data?.excerpt === "string"
                ? post.data.excerpt
                : post.body?.slice(0, 160);
            return (
              <li key={post.id}>
                <Link
                  href={`/blog/${slug}`}
                  className="group grid gap-4 sm:grid-cols-[180px_1fr] sm:gap-6"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-petal bg-stone/40">
                    {post.imageUrl && (
                      <Image
                        src={post.imageUrl}
                        alt=""
                        fill
                        sizes="180px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        unoptimized={!canOptimizeImage(post.imageUrl)}
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="font-display text-2xl text-ink group-hover:text-burgundy">
                      {post.title}
                    </h2>
                    {excerpt && (
                      <p className="mt-2 text-ink/70">{excerpt}</p>
                    )}
                    <span className="mt-3 inline-block text-sm font-medium text-sage">
                      Read more
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
