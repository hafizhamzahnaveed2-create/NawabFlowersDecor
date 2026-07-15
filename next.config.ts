import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root (a stray lockfile exists in the user home dir).
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      // Dev seed images; production photos will come from blob storage.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
