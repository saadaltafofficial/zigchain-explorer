const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_DIR = path.join(__dirname, 'out');
const DEPLOY_DIR = path.join(__dirname, 'cloudflare-deploy');
const MAX_FILE_SIZE_MB = 20; // Keep below Cloudflare's 25MB limit

// Directories/files to exclude
const EXCLUDE_PATTERNS = [
  'cache',
  '.next/cache',
  '_next/cache',
  'node_modules',
  '.git',
  '.pack',
  'webpack'
];

// Function to check if path should be excluded
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
}

// Function to copy directory recursively
function copyDir(src, dest) {
  if (shouldExclude(src)) {
    console.log(`Skipping excluded directory: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldExclude(srcPath)) {
      console.log(`Skipping excluded path: ${srcPath}`);
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // Check file size
      const stats = fs.statSync(srcPath);
      const fileSizeMB = stats.size / (1024 * 1024);

      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        console.log(`Skipping large file (${fileSizeMB.toFixed(2)}MB): ${srcPath}`);
        continue;
      }

      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Create a fresh deploy directory
function createDeployDir() {
  console.log('Creating fresh deployment directory...');
  if (fs.existsSync(DEPLOY_DIR)) {
    fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

// Copy essential files, skipping large files and cache directories
function copyEssentialFiles() {
  console.log('Copying essential files to deployment directory...');
  copyDir(SOURCE_DIR, DEPLOY_DIR);
}

// Copy functions directory for Cloudflare Pages Functions
function copyFunctions() {
  console.log('Copying Cloudflare Functions...');
  const functionsDir = path.join(__dirname, 'functions');
  const destFunctionsDir = path.join(DEPLOY_DIR, 'functions');
  
  if (fs.existsSync(functionsDir)) {
    copyDir(functionsDir, destFunctionsDir);
  }
}

// Function to remove webpack cache files
function removeWebpackCache() {
  console.log('Explicitly removing webpack cache files...');
  
  // Check for cache directory
  const cacheDir = path.join(DEPLOY_DIR, 'cache');
  if (fs.existsSync(cacheDir)) {
    console.log(`Removing cache directory: ${cacheDir}`);
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  
  // Check for webpack directory
  const webpackDir = path.join(DEPLOY_DIR, '_next', 'cache', 'webpack');
  if (fs.existsSync(webpackDir)) {
    console.log(`Removing webpack directory: ${webpackDir}`);
    fs.rmSync(webpackDir, { recursive: true, force: true });
  }
  
  // Find and remove all .pack files
  console.log('Searching for .pack files...');
  findAndRemoveLargeFiles(DEPLOY_DIR);
}

// Function to find and remove large files
function findAndRemoveLargeFiles(directory, maxSizeMB = 20) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    
    if (entry.isDirectory()) {
      findAndRemoveLargeFiles(fullPath, maxSizeMB);
    } else {
      // Check if it's a .pack file or a large file
      if (entry.name.endsWith('.pack')) {
        console.log(`Removing .pack file: ${fullPath}`);
        fs.unlinkSync(fullPath);
      } else {
        // Check file size
        const stats = fs.statSync(fullPath);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB > maxSizeMB) {
          console.log(`Removing large file (${fileSizeMB.toFixed(2)}MB): ${fullPath}`);
          fs.unlinkSync(fullPath);
        }
      }
    }
  }
}

// Main function
async function main() {
  try {
    console.log('Starting Cloudflare Pages deployment preparation...');
    
    // Create the deployment directory
    createDeployDir();
    
    // Copy essential files
    copyEssentialFiles();
    
    // Copy functions
    copyFunctions();
    
    // Remove webpack cache files
    removeWebpackCache();
    
    console.log('Deployment preparation complete!');
    console.log(`Optimized deployment package created at: ${DEPLOY_DIR}`);
    console.log('Use this directory to deploy to Cloudflare Pages.');
  } catch (error) {
    console.error('Error preparing deployment:', error);
    process.exit(1);
  }
}

// Run the script
main();
