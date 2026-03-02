import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.md': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  async redirects() {
    return [
      {
        source: '/portfolio',
        destination: '/exposure/portfolio',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
