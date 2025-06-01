/**
 * Script to clean up webpack cache files before deployment
 * This script should be run before deploying to Cloudflare Pages
 */

const fs = require('fs');
const path = require('path');

// Directories to clean
const DIRECTORIES_TO_CLEAN = [
  path.join(__dirname, 'cache'),
  path.join(__dirname, '.next', 'cache'),
  path.join(__dirname, 'out', 'cache'),
  path.join(__dirname, 'cloudflare-deploy', 'cache')
];

// File patterns to remove
const FILE_PATTERNS = [
  '.pack'
];

// Function to check if a file matches any of the patterns
function matchesPattern(filename) {
  return FILE_PATTERNS.some(pattern => filename.endsWith(pattern));
}

// Function to recursively remove files and directories
function cleanDirectory(directory) {
  if (!fs.existsSync(directory)) {
    return;
  }

  console.log(`Cleaning directory: ${directory}`);

  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        // If it's a webpack cache directory, remove it entirely
        if (entry.name === 'webpack' || entry.name === 'cache') {
          console.log(`Removing webpack/cache directory: ${fullPath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          // Otherwise, recursively clean the directory
          cleanDirectory(fullPath);
        }
      } else if (matchesPattern(entry.name)) {
        // Remove files that match the patterns
        console.log(`Removing file: ${fullPath}`);
        fs.unlinkSync(fullPath);
      } else {
        // Check file size and remove if too large (> 20MB)
        const stats = fs.statSync(fullPath);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB > 20) {
          console.log(`Removing large file (${fileSizeMB.toFixed(2)}MB): ${fullPath}`);
          fs.unlinkSync(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error cleaning directory ${directory}:`, error);
  }
}

// Main function
function main() {
  console.log('Starting cache cleanup...');

  // Clean each directory
  DIRECTORIES_TO_CLEAN.forEach(dir => {
    cleanDirectory(dir);
  });

  console.log('Cache cleanup complete!');
}

// Run the script
main();
