/** Helpers for homepage hero image / video media. */

export function isDirectVideoUrl(url: string): boolean {
  return (
    /^\/uploads\//.test(url) ||
    /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) ||
    /\/video\//i.test(url)
  );
}

/** Convert common YouTube share links to an embeddable URL, or null. */
export function youtubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "").split("/")[0] || null;
    } else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v");
      if (!id && u.pathname.startsWith("/embed/")) {
        id = u.pathname.split("/")[2] || null;
      }
      if (!id && u.pathname.startsWith("/shorts/")) {
        id = u.pathname.split("/")[2] || null;
      }
    }
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&rel=0`;
  } catch {
    return null;
  }
}
