// Cloudflare Pages configuration for Next.js
module.exports = {
  // Specify the build command
  build: {
    command: "npm run build",
    environment: {
      NODE_VERSION: "18"
    },
    outputDirectory: ".next"
  },
  // Configure routes for Next.js
  routes: [
    // Handle API routes
    { pattern: "/api/*", script: "api" },
    // Handle static assets
    { pattern: "/static/*", destination: "/static/$1" },
    // Handle Next.js routes
    { pattern: "/*", script: "index" }
  ]
};
