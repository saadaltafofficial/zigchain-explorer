/**
 * Bundle Size Analyzer Script
 * 
 * This script analyzes the Next.js build output to identify large chunks
 * that might exceed Cloudflare's 25MB file size limit.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const BUILD_DIR = path.join(__dirname, '.next');
const SIZE_LIMIT_MB = 25;
const SIZE_WARNING_MB = 20;

// Convert bytes to MB for readability
function bytesToMB(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

// Format sizes with colors for console output
function formatSize(sizeInBytes) {
  const sizeInMB = bytesToMB(sizeInBytes);
  if (sizeInMB >= SIZE_LIMIT_MB) {
    return `\x1b[31m${sizeInMB} MB\x1b[0m`; // Red for over limit
  } else if (sizeInMB >= SIZE_WARNING_MB) {
    return `\x1b[33m${sizeInMB} MB\x1b[0m`; // Yellow for warning
  } else {
    return `\x1b[32m${sizeInMB} MB\x1b[0m`; // Green for good
  }
}

// Check if build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('\x1b[31mError: .next directory not found. Run "pnpm build" first.\x1b[0m');
  process.exit(1);
}

console.log('\x1b[36m=== ZigChain Explorer Bundle Size Analysis ===\x1b[0m');
console.log(`Analyzing build output in ${BUILD_DIR}...\n`);

// Analyze server chunks
const serverDir = path.join(BUILD_DIR, 'server/chunks');
if (fs.existsSync(serverDir)) {
  console.log('\x1b[36m=== Server Chunks ===\x1b[0m');
  const serverFiles = fs.readdirSync(serverDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(serverDir, file);
      const stats = fs.statSync(filePath);
      return { file, size: stats.size, path: filePath };
    })
    .sort((a, b) => b.size - a.size);

  serverFiles.forEach(({ file, size, path }) => {
    console.log(`${file}: ${formatSize(size)}`);
  });

  // Check for large server files
  const largeServerFiles = serverFiles.filter(f => bytesToMB(f.size) >= SIZE_WARNING_MB);
  if (largeServerFiles.length > 0) {
    console.log('\n\x1b[33mWarning: Large server chunks detected!\x1b[0m');
    largeServerFiles.forEach(({ file, size }) => {
      console.log(`  - ${file}: ${formatSize(size)}`);
    });
  }
}

// Analyze static chunks
const staticDir = path.join(BUILD_DIR, 'static/chunks');
if (fs.existsSync(staticDir)) {
  console.log('\n\x1b[36m=== Static Chunks ===\x1b[0m');
  const staticFiles = fs.readdirSync(staticDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(staticDir, file);
      const stats = fs.statSync(filePath);
      return { file, size: stats.size, path: filePath };
    })
    .sort((a, b) => b.size - a.size);

  staticFiles.forEach(({ file, size }) => {
    console.log(`${file}: ${formatSize(size)}`);
  });

  // Check for large static files
  const largeStaticFiles = staticFiles.filter(f => bytesToMB(f.size) >= SIZE_WARNING_MB);
  if (largeStaticFiles.length > 0) {
    console.log('\n\x1b[33mWarning: Large static chunks detected!\x1b[0m');
    largeStaticFiles.forEach(({ file, size }) => {
      console.log(`  - ${file}: ${formatSize(size)}`);
    });
  }
}

// Analyze cache files
const cacheDir = path.join(BUILD_DIR, 'cache');
if (fs.existsSync(cacheDir)) {
  console.log('\n\x1b[36m=== Cache Files ===\x1b[0m');
  let totalCacheSize = 0;
  let largePackFiles = [];

  function scanDirectory(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDirectory(fullPath);
      } else if (file.name.endsWith('.pack')) {
        const stats = fs.statSync(fullPath);
        totalCacheSize += stats.size;
        
        if (bytesToMB(stats.size) >= SIZE_WARNING_MB) {
          largePackFiles.push({ file: path.relative(BUILD_DIR, fullPath), size: stats.size });
        }
      }
    }
  }

  scanDirectory(cacheDir);
  console.log(`Total cache size: ${formatSize(totalCacheSize)}`);
  
  if (largePackFiles.length > 0) {
    console.log('\n\x1b[33mWarning: Large .pack files detected!\x1b[0m');
    largePackFiles.forEach(({ file, size }) => {
      console.log(`  - ${file}: ${formatSize(size)}`);
    });
    console.log('\nThese files will be cleaned by the "clean:cache" script before deployment.');
  }
}

// Summary and recommendations
console.log('\n\x1b[36m=== Summary ===\x1b[0m');
console.log(`Cloudflare Pages file size limit: ${SIZE_LIMIT_MB} MB`);
console.log('\n\x1b[36m=== Recommendations ===\x1b[0m');
console.log('1. Use dynamic imports for large components');
console.log('2. Split large libraries into smaller chunks');
console.log('3. Use the "clean:cache" script before deployment');
console.log('4. Consider code-splitting for routes that use heavy dependencies');

console.log('\n\x1b[36m=== Next Steps ===\x1b[0m');
console.log('Run the following commands to build and deploy:');
console.log('  pnpm build');
console.log('  pnpm run clean:cache');
console.log('  pnpm run deploy:cloudflare');
