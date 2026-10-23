import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  allowedDevOrigins: [
    'localhost:3000',
    '192.168.1.43',
    '192.168.1.33'

  ]

};

export default nextConfig;
