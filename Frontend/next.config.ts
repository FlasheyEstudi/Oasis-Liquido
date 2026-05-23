import type { NextConfig } from "next";
import os from 'os';

// Backend URL for server-side proxy (never exposed to browser)
const BACKEND_URL = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8000';

// Dynamically collect all local network adapter IPs to allow Hot Module Replacement (HMR) from external devices
function getLocalIPs(): string[] {
  const ips: string[] = ['localhost', '127.0.0.1', '0.0.0.0'];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netInterfaces = interfaces[name];
    if (netInterfaces) {
      for (const iface of netInterfaces) {
        if (iface.family === 'IPv4') {
          ips.push(iface.address);
        }
      }
    }
  }
  return ips;
}

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
  // Proxy API and Socket.io calls server-side → eliminates mixed content on HTTPS tunnels
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
      {
        source: '/socket.io/:path*',
        destination: `${BACKEND_URL}/socket.io/:path*`,
      },
    ];
  },
  // @ts-ignore - Next.js 15+ dev origins
  allowedDevOrigins: [
    ...getLocalIPs(),
    // Tunnel domains for mobile testing (localtunnel, ngrok, cloudflared)
    '*.loca.lt',
    '*.ngrok.io',
    '*.ngrok-free.app',
    '*.trycloudflare.com',
  ],
};

export default nextConfig;
