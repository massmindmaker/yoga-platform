import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Performance optimizations
  experimental: {
    // Optimize package imports for faster dev/build
    optimizePackageImports: ['lucide-react', 'framer-motion', 'date-fns'],
  },
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Enable compression
  compress: true,
  // Powered by header (disable for slight perf improvement)
  poweredByHeader: false,
};

export default nextConfig;
