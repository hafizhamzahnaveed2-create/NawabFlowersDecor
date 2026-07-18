import Link from "next/link";
import { getPublishedBlock } from "@/lib/repositories/content";

function MarqueeText({ text }: { text: string }) {
  return (
    <div className="announcement-track overflow-hidden py-2.5" role="status">
      <div className="announcement-marquee flex w-max whitespace-nowrap">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            aria-hidden={i > 0 ? true : undefined}
            className="inline-flex shrink-0 items-center gap-10 px-5 text-sm text-ivory"
          >
            <span>{text}</span>
            <span className="text-ivory/40" aria-hidden>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Scrolling news ticker (enable via Website content → News ticker). */
export async function NewsTicker() {
  const block = await getPublishedBlock("announcement.ticker");
  if (!block?.title) return null;

  const content = <MarqueeText text={block.title} />;

  return (
    <div className="bg-burgundy-deep">
      {block.linkUrl ? (
        <Link
          href={block.linkUrl}
          className="block focus-visible:outline-offset-[-2px]"
        >
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
