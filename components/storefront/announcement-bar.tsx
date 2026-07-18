import Link from "next/link";
import { getPublishedBlock } from "@/lib/repositories/content";

/** Static centered announcement strip (enable via Website content → Announcement bar). */
export async function AnnouncementBar() {
  const block = await getPublishedBlock("announcement.main");
  if (!block?.title) return null;

  const inner = (
    <p className="mx-auto max-w-6xl px-6 py-2.5 text-center text-sm text-ivory">
      {block.title}
    </p>
  );

  return (
    <div className="bg-burgundy">
      {block.linkUrl ? (
        <Link href={block.linkUrl} className="block hover:underline">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
