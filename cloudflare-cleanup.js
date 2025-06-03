/**
 * Enhanced Cloudflare deployment cleanup script
 * 
 * This script aggressively removes cache files and large files over 20MB
 * to prevent Cloudflare Pages deployment failures due to size limits.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = '.next';
const SIZE_LIMIT_MB = 20; // Files larger than this will be removed

// Directories to always clean
const CACHE_DIRS = [
  path.join(BUILD_DIR, 'cache'),
  path.join(BUILD_DIR, 'cache', 'webpack'),
  path.join(BUILD_DIR, '.cache'),
];

// File patterns to always remove
const FILE_PATTERNS = [
  /\.pack$/,
  /\.pack\.gz$/,
  /\.map$/
];

console.log('🧹 Starting Cloudflare deployment cleanup...');

// 1. Remove known cache directories
CACHE_DIRS.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Removing cache directory: ${dir}`);
    try {
      execSync(`rimraf "${dir}"`);
    } catch (e) {
      console.warn(`Warning: Failed to remove ${dir}: ${e.message}`);
    }
  }
});

// 2. Find and remove large files and files matching patterns
function scanAndCleanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and already cleaned cache dirs
      if (entry.name === 'node_modules' || CACHE_DIRS.includes(fullPath)) {
        continue;
      }
      scanAndCleanDirectory(fullPath);
    } else if (entry.isFile()) {
      // Check file patterns
      const shouldRemoveByPattern = FILE_PATTERNS.some(pattern => pattern.test(entry.name));
      
      // Check file size
      let shouldRemoveBySize = false;
      try {
        const stats = fs.statSync(fullPath);
        const fileSizeMB = stats.size / (1024 * 1024);
        shouldRemoveBySize = fileSizeMB > SIZE_LIMIT_MB;
        
        if (shouldRemoveBySize) {
          console.log(`Large file detected: ${fullPath} (${fileSizeMB.toFixed(2)} MB)`);
        }
      } catch (e) {
        console.warn(`Warning: Could not check size of ${fullPath}: ${e.message}`);
      }
      
      // Remove file if needed
      if (shouldRemoveByPattern || shouldRemoveBySize) {
        try {
          console.log(`Removing file: ${fullPath}`);
          fs.unlinkSync(fullPath);
        } catch (e) {
          console.warn(`Warning: Failed to remove ${fullPath}: ${e.message}`);
        }
      }
    }
  }
}

// Start scanning from build directory
scanAndCleanDirectory(BUILD_DIR);

console.log('✅ Cloudflare deployment cleanup complete!');
