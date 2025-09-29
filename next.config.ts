import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use Turbopack configuration
  turbopack: {
    resolveAlias: {
      // Add any custom path aliases here if needed
      '@': './src',
    },
  },
};

export default nextConfig;
