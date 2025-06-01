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
  '.pack'
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
