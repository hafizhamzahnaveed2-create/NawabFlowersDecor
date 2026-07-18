import { getBlocksForAdmin, listAllBlocksForAdmin } from "@/lib/repositories/content";
import { ContentBlockForm } from "./content-form";
import { CmsBlocksPanel } from "./cms-blocks-panel";
import { requirePagePermission } from "../require-page-permission";

export const metadata = { title: "Content · Admin" };

function videoFromData(data: Record<string, unknown> | null | undefined) {
  return typeof data?.videoUrl === "string" ? data.videoUrl : "";
}

export default async function AdminContentPage() {
  await requirePagePermission("content.write");
  const [legacy, all] = await Promise.all([
    getBlocksForAdmin(),
    listAllBlocksForAdmin(),
  ]);
  const hero = legacy.get("home.hero");
  const announcement = legacy.get("announcement.main");
  const ticker = legacy.get("announcement.ticker");

  const byKind = {
    HERO_SLIDE: all.filter(
      (b) => b.kind === "HERO_SLIDE" && b.key !== "home.hero",
    ),
    BANNER: all.filter((b) => b.kind === "BANNER"),
    FAQ: all.filter((b) => b.kind === "FAQ"),
    POLICY: all.filter((b) => b.kind === "POLICY"),
    SECTION: all.filter((b) => b.kind === "SECTION"),
    TESTIMONIAL: all.filter((b) => b.kind === "TESTIMONIAL"),
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Content</h1>
      <p className="mt-1 text-ink/60">
        Homepage, FAQs, policies, blog, banners, and popups — save to publish.
      </p>

      <ContentBlockForm
        blockKey="announcement.main"
        heading="Announcement bar"
        description="Static message centered at the top of every shop page. Use “Show on the site” to turn it on or off. You can enable this, the news ticker, or both."
        fields={["title", "linkUrl"]}
        initial={{
          title: announcement?.title ?? "",
          body: "",
          imageUrl: announcement?.imageUrl ?? "",
          videoUrl: "",
          linkUrl: announcement?.linkUrl ?? "",
          isPublished: announcement?.isPublished ?? false,
        }}
      />

      <ContentBlockForm
        blockKey="announcement.ticker"
        heading="News ticker"
        description="Scrolling message (right → left) under the announcement bar. Separate from the static bar — enable one, the other, or both with “Show on the site”."
        fields={["title", "linkUrl"]}
        initial={{
          title: ticker?.title ?? "",
          body: "",
          imageUrl: ticker?.imageUrl ?? "",
          videoUrl: "",
          linkUrl: ticker?.linkUrl ?? "",
          isPublished: ticker?.isPublished ?? false,
        }}
      />

      <ContentBlockForm
        blockKey="home.hero"
        heading="Primary hero"
        description="The main welcome at the top of the homepage. Extra slides below can rotate with this one. Add a photo, optional video, and a click link for the main button."
        fields={["title", "body", "imageUrl", "videoUrl", "linkUrl"]}
        initial={{
          title: hero?.title ?? "",
          body: hero?.body ?? "",
          imageUrl: hero?.imageUrl ?? "",
          videoUrl: videoFromData(hero?.data),
          linkUrl: hero?.linkUrl ?? "",
          isPublished: hero?.isPublished ?? false,
        }}
      />

      <CmsBlocksPanel kind="HERO_SLIDE" blocks={byKind.HERO_SLIDE} />
      <CmsBlocksPanel kind="BANNER" blocks={byKind.BANNER} />
      <CmsBlocksPanel kind="FAQ" blocks={byKind.FAQ} />
      <CmsBlocksPanel kind="POLICY" blocks={byKind.POLICY} />
      <CmsBlocksPanel kind="SECTION" blocks={byKind.SECTION} />
      <CmsBlocksPanel kind="TESTIMONIAL" blocks={byKind.TESTIMONIAL} />
    </div>
  );
}
