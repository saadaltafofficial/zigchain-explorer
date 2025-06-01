/**
 * Script to build and prepare optimized distribution folder for GitHub deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DIST_DIR = path.join(__dirname, 'dist');
const SOURCE_DIR = path.join(__dirname, 'out');
const FUNCTIONS_DIR = path.join(__dirname, 'functions');

// Create dist directory
function createDistDir() {
  console.log('Creating fresh dist directory...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // Skip large files and cache directories
    if (srcPath.includes('cache') || 
        srcPath.includes('node_modules') || 
        srcPath.includes('.git') || 
        srcPath.includes('.pack')) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // Check file size (skip files > 20MB)
      const stats = fs.statSync(srcPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      
      if (fileSizeMB > 20) {
        console.log(`Skipping large file (${fileSizeMB.toFixed(2)}MB): ${srcPath}`);
        continue;
      }
      
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Compress JS files
function compressJsFiles() {
  console.log('Compressing JS files...');
  try {
    // Check if terser is installed
    try {
      execSync('npx terser --version', { stdio: 'pipe' });
    } catch (err) {
      console.log('Installing terser...');
      execSync('npm install -g terser', { stdio: 'inherit' });
    }
    
    const jsFiles = [];
    function findJsFiles(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !fullPath.includes('functions')) {
          findJsFiles(fullPath);
        } else if (entry.name.endsWith('.js') && !fullPath.includes('functions')) {
          jsFiles.push(fullPath);
        }
      }
    }
    
    findJsFiles(DIST_DIR);
    
    for (const file of jsFiles) {
      try {
        console.log(`Compressing ${path.relative(DIST_DIR, file)}`);
        execSync(`npx terser "${file}" --compress --mangle --output "${file}"`, { stdio: 'pipe' });
      } catch (err) {
        console.warn(`Warning: Could not compress ${file}`, err.message);
      }
    }
    
    console.log(`Compressed ${jsFiles.length} JS files`);
  } catch (err) {
    console.error('Error compressing JS files:', err);
  }
}

// Create GitHub-specific files
function createGitHubFiles() {
  // Create a .nojekyll file to disable Jekyll processing
  fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');
  
  // Create a simple README.md
  const readmeContent = `# ZigChain Explorer - Distribution

This repository contains the optimized build of the ZigChain Explorer for deployment to Cloudflare Pages.

## Deployment

Connect this repository to Cloudflare Pages for automatic deployment.

## Build Information

Built on: ${new Date().toISOString()}
`;
  
  fs.writeFileSync(path.join(DIST_DIR, 'README.md'), readmeContent);
}

// Main function
async function main() {
  try {
    console.log('Starting build for GitHub deployment...');
    
    // Build the Next.js application
    console.log('Building Next.js application...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Create the dist directory
    createDistDir();
    
    // Copy the build output
    console.log('Copying build output to dist directory...');
    copyDir(SOURCE_DIR, DIST_DIR);
    
    // Copy the functions directory
    console.log('Copying Cloudflare Functions...');
    copyDir(FUNCTIONS_DIR, path.join(DIST_DIR, 'functions'));
    
    // Compress JS files
    compressJsFiles();
    
    // Create GitHub-specific files
    createGitHubFiles();
    
    console.log('Build for GitHub deployment complete!');
    console.log(`Optimized distribution created at: ${DIST_DIR}`);
    console.log('You can now commit and push this directory to a GitHub repository.');
  } catch (error) {
    console.error('Error preparing GitHub deployment:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(err => {
  console.error('Error during build process:', err);
  process.exit(1);
});
