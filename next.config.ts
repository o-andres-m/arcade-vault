import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.43',
    '192.168.1.33'

  ],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

};

export default nextConfig;
