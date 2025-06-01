/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Cloudflare Pages specific configuration
  output: 'export',  // Static export for Cloudflare Pages
  images: {
    unoptimized: true, // Required for static export
  },
  // Disable React strict mode for production
  reactStrictMode: false,
  // Trailing slash for better compatibility with Cloudflare Pages
  trailingSlash: true,
};

export default nextConfig;
