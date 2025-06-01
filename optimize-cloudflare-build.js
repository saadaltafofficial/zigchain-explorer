/**
 * Script to optimize the Next.js build output for Cloudflare Pages
 * This script runs after the build to reduce bundle size and remove unnecessary files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = path.join(__dirname, 'cloudflare-deploy');

// Function to recursively get all files in a directory
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

// Function to compress JS files
function compressJsFiles() {
  console.log('Compressing JS files...');
  try {
    // Install terser if not already installed
    execSync('npm list -g terser || npm install -g terser', { stdio: 'inherit' });
    
    const jsFiles = getAllFiles(BUILD_DIR).filter(file => file.endsWith('.js') && !file.includes('functions/'));
    
    jsFiles.forEach(file => {
      try {
        console.log(`Compressing ${path.relative(BUILD_DIR, file)}`);
        execSync(`terser "${file}" --compress --mangle --output "${file}"`, { stdio: 'pipe' });
      } catch (err) {
        console.warn(`Warning: Could not compress ${file}`, err.message);
      }
    });
    
    console.log('JS compression complete!');
  } catch (err) {
    console.error('Error compressing JS files:', err);
  }
}

// Function to remove source maps
function removeSourceMaps() {
  console.log('Removing source maps...');
  const mapFiles = getAllFiles(BUILD_DIR).filter(file => file.endsWith('.map'));
  
  mapFiles.forEach(file => {
    console.log(`Removing ${path.relative(BUILD_DIR, file)}`);
    fs.unlinkSync(file);
  });
  
  console.log(`Removed ${mapFiles.length} source map files`);
}

// Function to remove webpack cache files
function removeWebpackCache() {
  console.log('Removing webpack cache files...');
  const cacheDir = path.join(BUILD_DIR, 'cache');
  
  if (fs.existsSync(cacheDir)) {
    console.log(`Removing ${cacheDir}`);
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }
  
  console.log('Webpack cache removed!');
}

// Main function
async function main() {
  console.log('Starting build optimization for Cloudflare Pages...');
  
  // Check if build directory exists
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`Build directory ${BUILD_DIR} does not exist!`);
    process.exit(1);
  }
  
  // Run optimization steps
  removeSourceMaps();
  removeWebpackCache();
  compressJsFiles();
  
  console.log('Build optimization complete!');
}

// Run the main function
main().catch(err => {
  console.error('Error during build optimization:', err);
  process.exit(1);
});
