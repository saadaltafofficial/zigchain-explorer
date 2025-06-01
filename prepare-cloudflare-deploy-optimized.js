/**
 * Optimized Cloudflare Deployment Preparation Script
 * 
 * This script prepares the Next.js build output for deployment to Cloudflare Pages
 * with special handling to avoid the 25 MiB file size limit.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SOURCE_DIR = path.join(__dirname, 'out');
const FUNCTIONS_DIR = path.join(__dirname, 'functions');
const DEPLOY_DIR = path.join(__dirname, 'cloudflare-deploy');
const MAX_FILE_SIZE_MB = 20; // Set below Cloudflare's 25 MiB limit for safety

// Files and directories to exclude from deployment
const EXCLUDE_PATTERNS = [
  // Webpack cache files
  /[\\\/]cache[\\\/]webpack[\\\/]/,
  /\.pack$/,
  
  // Source maps
  /\.map$/,
  
  // Cache directories
  /[\\\/]\.cache[\\\/]/,
  /[\\\/]cache[\\\/]/,
  
  // Development files
  /[\\\/]\.git[\\\/]/,
  /[\\\/]\.github[\\\/]/,
  /[\\\/]\.vscode[\\\/]/,
  /[\\\/]\.idea[\\\/]/,
  
  // Build artifacts
  /[\\\/]\.swc[\\\/]/,
  /[\\\/]\.turbo[\\\/]/,
  
  // Node modules
  /[\\\/]node_modules[\\\/]/
];

/**
 * Create the deployment directory
 */
function createDeployDir() {
  console.log(`Creating deployment directory: ${DEPLOY_DIR}`);
  
  if (fs.existsSync(DEPLOY_DIR)) {
    console.log('Removing existing deployment directory...');
    fs.rmSync(DEPLOY_DIR, { recursive: true, force: true });
  }
  
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

/**
 * Check if a file should be excluded based on patterns
 */
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
}

/**
 * Copy a file with size checking
 */
function copyFileWithSizeCheck(source, destination) {
  try {
    const stats = fs.statSync(source);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Skip files that are too large
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      console.log(`Skipping large file (${fileSizeMB.toFixed(2)} MB): ${source}`);
      return false;
    }
    
    // Create the destination directory if it doesn't exist
    const destDir = path.dirname(destination);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(source, destination);
    return true;
  } catch (error) {
    console.error(`Error copying file ${source}:`, error);
    return false;
  }
}

/**
 * Copy a directory recursively
 */
function copyDir(sourceDir, destDir, relativePath = '') {
  if (!fs.existsSync(sourceDir)) {
    console.log(`Source directory doesn't exist: ${sourceDir}`);
    return;
  }
  
  // Create the destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  let filesCopied = 0;
  let filesSkipped = 0;
  
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    const relPath = path.join(relativePath, entry.name);
    
    // Skip excluded files and directories
    if (shouldExclude(sourcePath)) {
      console.log(`Skipping excluded path: ${sourcePath}`);
      filesSkipped++;
      continue;
    }
    
    if (entry.isDirectory()) {
      // Recursively copy the directory
      const result = copyDir(sourcePath, destPath, relPath);
      filesCopied += result.filesCopied;
      filesSkipped += result.filesSkipped;
    } else {
      // Copy the file with size checking
      if (copyFileWithSizeCheck(sourcePath, destPath)) {
        filesCopied++;
      } else {
        filesSkipped++;
      }
    }
  }
  
  return { filesCopied, filesSkipped };
}

/**
 * Copy the .cfignore file to the deployment directory
 */
function copyCfIgnore() {
  const cfIgnorePath = path.join(__dirname, '.cfignore');
  const destPath = path.join(DEPLOY_DIR, '.cfignore');
  
  if (fs.existsSync(cfIgnorePath)) {
    console.log('Copying .cfignore file...');
    fs.copyFileSync(cfIgnorePath, destPath);
  } else {
    console.log('No .cfignore file found, creating one...');
    const content = EXCLUDE_PATTERNS
      .map(pattern => pattern.toString().replace(/[\\\/]/g, '/').replace(/^\/(.*)\/$/g, '$1'))
      .join('\n');
    fs.writeFileSync(destPath, content);
  }
}

/**
 * Copy wrangler.toml to the deployment directory
 */
function copyWranglerConfig() {
  const wranglerPath = path.join(__dirname, 'wrangler.toml');
  const destPath = path.join(DEPLOY_DIR, 'wrangler.toml');
  
  if (fs.existsSync(wranglerPath)) {
    console.log('Copying wrangler.toml file...');
    fs.copyFileSync(wranglerPath, destPath);
  }
}

/**
 * Create a report of the largest files in the deployment directory
 */
function createSizeReport() {
  console.log('\nGenerating size report for largest files...');
  
  try {
    // Find the 20 largest files
    const command = `powershell -Command "Get-ChildItem -Path '${DEPLOY_DIR}' -Recurse -File | Sort-Object -Property Length -Descending | Select-Object -First 20 | Format-Table -Property Name,@{Name='Size (MB)';Expression={'{0:N2}' -f ($_.Length / 1MB)}},FullName"`;
    const result = execSync(command, { encoding: 'utf8' });
    
    console.log('Top 20 largest files:');
    console.log(result);
  } catch (error) {
    console.error('Error generating size report:', error);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Starting optimized Cloudflare deployment preparation...');
  
  // Create the deployment directory
  createDeployDir();
  
  // Copy the build output
  console.log(`Copying build output from ${SOURCE_DIR} to ${DEPLOY_DIR}...`);
  const buildResult = copyDir(SOURCE_DIR, DEPLOY_DIR);
  console.log(`Copied ${buildResult.filesCopied} files, skipped ${buildResult.filesSkipped} files.`);
  
  // Copy the functions directory
  console.log(`Copying functions from ${FUNCTIONS_DIR} to ${path.join(DEPLOY_DIR, 'functions')}...`);
  const functionsResult = copyDir(FUNCTIONS_DIR, path.join(DEPLOY_DIR, 'functions'));
  console.log(`Copied ${functionsResult.filesCopied} functions files, skipped ${functionsResult.filesSkipped} files.`);
  
  // Copy configuration files
  copyCfIgnore();
  copyWranglerConfig();
  
  // Create a report of the largest files
  createSizeReport();
  
  console.log('\nCloudflare deployment preparation complete!');
  console.log(`Deployment directory: ${DEPLOY_DIR}`);
  console.log('Run the following command to deploy:');
  console.log('npx wrangler pages deploy cloudflare-deploy --skip-caching');
}

// Run the script
main();
