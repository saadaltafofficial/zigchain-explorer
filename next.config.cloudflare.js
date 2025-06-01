/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Cloudflare Pages specific configuration
  output: 'standalone',
  // Enable image optimization through Cloudflare
  images: {
    unoptimized: true,
  },
  // Disable React strict mode for production
  reactStrictMode: false,
};

module.exports = nextConfig;
