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
  // Optimize build size for Cloudflare Pages
  webpack: (config, { isServer }) => {
    // Split chunks to reduce bundle size
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 1000000, // 1MB max chunk size
      cacheGroups: {
        default: false,
        vendors: false,
        framework: {
          name: 'framework',
          test: /[\/]node_modules[\/](@next|next|react|react-dom)[\/]/,
          priority: 40,
          chunks: 'all',
        },
        lib: {
          test: /[\/]node_modules[\/]/,
          priority: 30,
          chunks: 'all',
          name(module) {
            const packageName = module.context.match(/[\/]node_modules[\/](.*?)(?:[\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          },
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

    return config;
  },
};

export default nextConfig;
