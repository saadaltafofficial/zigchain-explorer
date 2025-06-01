/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Static export configuration
  output: 'export',
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  // Disable React strict mode for production
  reactStrictMode: false,
  // Simplified webpack configuration for static export
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Split chunks into smaller files
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 30,
        maxAsyncRequests: 30,
        minSize: 20000,
        maxSize: 20000000, // Keep chunks under 20MB
      };
    }
    return config;
  },
};

module.exports = nextConfig;
