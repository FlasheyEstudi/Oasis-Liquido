import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // @ts-ignore - Next.js 15 dev origins
  allowedDevOrigins: ['192.168.0.100', '192.168.1.100'],
};

export default nextConfig;
