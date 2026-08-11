import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },

  // Add any other config options you have here
  // For example:
  images: {
    domains: [],
  },

  experimental: {
    // ...
  },
};

export default nextConfig;
