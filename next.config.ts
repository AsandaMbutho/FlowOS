import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // ❌ REMOVED - This is now enabled by default in Next.js 15+
  poweredByHeader: false,
  compress: true,
  generateEtags: true,

  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === "development",
  },

  experimental: {
    optimizeCss: true,
  },

  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
