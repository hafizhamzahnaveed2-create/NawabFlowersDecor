import { getBlocksForAdmin } from "@/lib/repositories/content";
import { ContentBlockForm } from "./content-form";

export const metadata = { title: "Content · Admin" };

export default async function AdminContentPage() {
  const blocks = await getBlocksForAdmin();
  const hero = blocks.get("home.hero");
  const announcement = blocks.get("announcement.main");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-burgundy">Homepage content</h1>
      <p className="mt-1 text-ink/60">
        Change the words and photos customers see first. Saving publishes
        immediately.
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
        heading="Hero section"
        description="The big welcome at the top of the homepage: headline, a line underneath, and the photo."
        fields={["title", "body", "imageUrl"]}
        initial={{
          title: hero?.title ?? "",
          body: hero?.body ?? "",
          imageUrl: hero?.imageUrl ?? "",
          linkUrl: hero?.linkUrl ?? "",
          isPublished: hero?.isPublished ?? false,
        }}
      />
    </div>
  );
}
