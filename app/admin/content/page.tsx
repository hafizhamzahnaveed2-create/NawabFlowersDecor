import { getBlocksForAdmin, listAllBlocksForAdmin } from "@/lib/repositories/content";
import { ContentBlockForm } from "./content-form";
import { CmsBlocksPanel } from "./cms-blocks-panel";

export const metadata = { title: "Content · Admin" };

export default async function AdminContentPage() {
  const [legacy, all] = await Promise.all([
    getBlocksForAdmin(),
    listAllBlocksForAdmin(),
  ]);
  const hero = legacy.get("home.hero");
  const announcement = legacy.get("announcement.main");

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
        description="A short line across the top of every page — offers, holiday cut-offs, that sort of thing. Unpublish to hide it."
        fields={["title", "linkUrl"]}
        initial={{
          title: announcement?.title ?? "",
          body: "",
          imageUrl: announcement?.imageUrl ?? "",
          linkUrl: announcement?.linkUrl ?? "",
          isPublished: announcement?.isPublished ?? false,
        }}
      />

      <ContentBlockForm
        blockKey="home.hero"
        heading="Primary hero"
        description="The main welcome at the top of the homepage. Extra slides below can rotate with this one."
        fields={["title", "body", "imageUrl"]}
        initial={{
          title: hero?.title ?? "",
          body: hero?.body ?? "",
          imageUrl: hero?.imageUrl ?? "",
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
