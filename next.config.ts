import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/ai-gym-tracker',
  assetPrefix: '/ai-gym-tracker',
  images: {
    unoptimized: true,
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
