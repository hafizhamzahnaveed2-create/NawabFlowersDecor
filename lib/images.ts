/** Hosts we can safely send through the Next.js image optimizer. */
export function canOptimizeImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  return (
    url.includes("images.unsplash.com") ||
    url.includes("blob.vercel-storage.com")
  );
}
