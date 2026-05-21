import type { NextConfig } from "next";

const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: '/api/socket',
      },
    ];
  },
};

export default nextConfig;
