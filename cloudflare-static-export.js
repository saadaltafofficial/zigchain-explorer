// This script helps prepare the Next.js static export for Cloudflare Pages

const fs = require('fs');
const path = require('path');

console.log('Preparing Next.js static export for Cloudflare Pages...');

// Define directories
const outDir = path.join(__dirname, 'out');
const nextDir = path.join(outDir, '_next');

// Check if the out directory exists
if (!fs.existsSync(outDir)) {
  console.error('Error: "out" directory not found. Run "next build" first.');
  process.exit(1);
}

// Create a _headers file to set caching headers
const headersContent = `# Cache static assets for 1 year
/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

# Cache page data for 1 minute
/_next/data/*
  Cache-Control: public, max-age=60

# Don't cache HTML pages
/*
  Cache-Control: public, max-age=0, must-revalidate
`;

fs.writeFileSync(path.join(outDir, '_headers'), headersContent);
console.log('Created _headers file with caching rules');

// Create a _routes.json file to handle dynamic routes
const routesContent = `{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/static/*"]
}`;

fs.writeFileSync(path.join(outDir, '_routes.json'), routesContent);
console.log('Created _routes.json file for handling routes');

console.log('Static export is ready for Cloudflare Pages!');
