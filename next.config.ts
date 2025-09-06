import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimized for Firebase Hosting
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

export default nextConfig;
