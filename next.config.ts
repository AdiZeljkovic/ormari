import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // The dev badge would otherwise end up in the still renders taken from /studio.
  devIndicators: false,
  async redirects() {
    return [{ source: '/', destination: '/fr', permanent: false }];
  },
};

export default config;
