/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // For Cloudflare Pages, we'll use static export
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  // Add trailing slash to help with routing
  trailingSlash: true,
  // Configure webpack to split chunks more aggressively
  webpack: (config, { isServer }) => {
    // Only apply to client-side bundles
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        maxSize: 20000000, // 20MB max chunk size
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            test: /[\/]node_modules[\/](@react|react|react-dom|next|scheduler)[\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\/]node_modules[\/]/,
            name(module) {
              // Safely handle null module context
              if (!module.context) {
                return 'npm.unknown';
              }
              const match = module.context.match(/[\/]node_modules[\/](.*?)(?:[\/]|$)/);
              const packageName = match && match[1] ? match[1] : 'unknown';
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name: false,
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};

module.exports = nextConfig;
