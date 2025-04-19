import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  
  // Ensure the package is included in the server build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Make sure country-state-city is not externalized
      config.externals = [...(config.externals || [])].filter(
        (external) => typeof external !== 'string' || !external.includes('country-state-city')
      );
    }
    return config;
  }
};

export default nextConfig;
