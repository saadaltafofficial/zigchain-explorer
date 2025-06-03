// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Allow production builds to complete even with ESLint errors
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  // Add trailing slash to help with routing
  trailingSlash: true,
  // Simplified webpack configuration
  webpack: (config, { isServer }) => {
    // Only apply to client-side bundles
    if (!isServer) {
      // Use a simpler chunking strategy
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 5,
        maxAsyncRequests: 5,
        cacheGroups: {
          framework: {
            name: 'framework',
            test: /[\/]node_modules[\/](@react|react|react-dom|next|scheduler)[\/]/,
            priority: 40,
            enforce: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig