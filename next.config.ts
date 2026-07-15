import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root (a stray lockfile exists in the user home dir).
    root: path.join(__dirname),
  },
};

export default nextConfig;
