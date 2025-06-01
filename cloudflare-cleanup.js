/**
 * Cloudflare Deployment Cleanup Script
 * 
 * This script specifically targets files that cause issues with Cloudflare Pages' 25 MiB file size limit.
 * It should be run before deploying to Cloudflare Pages.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MAX_FILE_SIZE_MB = 20; // Set below Cloudflare's 25 MiB limit for safety
const DEPLOY_DIR = path.join(__dirname, 'cloudflare-deploy');

// Patterns of files and directories to remove
const REMOVE_PATTERNS = [
  // Webpack cache directories - but NOT webpack chunk files needed for runtime
  '**/cache/webpack/**',
  // Don't remove all webpack directories as they may contain needed chunks
  // '**/webpack/**', 
  '**/.next/cache/**',
  '**/out/cache/**',
  
  // Large pack files
  '**/*.pack',
  
  // Source maps in production
  '**/*.map',
  
  // Development files
  '**/.git/**',
  '**/.github/**',
  '**/.vscode/**',
  '**/.idea/**',
  
  // Build artifacts
  '**/.swc/**',
  '**/.turbo/**',
  
  // Node modules (should already be excluded but just in case)
  '**/node_modules/**'
];

/**
 * Find and remove files matching patterns
 */
function removePatternFiles() {
  console.log('Removing files matching patterns...');
  
  REMOVE_PATTERNS.forEach(pattern => {
    try {
      // Using find command for more efficient pattern matching
      const command = `powershell -Command "Get-ChildItem -Path '${DEPLOY_DIR}' -Recurse -File -Include ${pattern.replace('**/', '*')} | Remove-Item -Force"`;
      execSync(command, { stdio: 'inherit' });
      
      // Also try to remove directories matching the pattern
      const dirCommand = `powershell -Command "Get-ChildItem -Path '${DEPLOY_DIR}' -Recurse -Directory -Include ${pattern.replace('**/', '*').replace('/**', '')} | Remove-Item -Recurse -Force"`;
      execSync(dirCommand, { stdio: 'inherit' });
    } catch (error) {
      // Ignore errors if no files match
      if (!error.message.includes('Cannot find path')) {
        console.warn(`Warning when removing pattern ${pattern}:`, error.message);
      }
    }
  });
}

/**
 * Find and remove large files
 */
function removeLargeFiles(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`Directory doesn't exist: ${directory}`);
    return;
  }

  console.log(`Scanning for large files in: ${directory}`);

  try {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and other problematic directories
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        
        // If it's a cache directory, remove it entirely
        if (entry.name === 'cache' || entry.name === 'webpack') {
          console.log(`Removing cache directory: ${fullPath}`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          continue;
        }
        
        // Otherwise, recursively check the directory
        removeLargeFiles(fullPath);
      } else {
        // Check if it's a large file
        const stats = fs.statSync(fullPath);
        const fileSizeMB = stats.size / (1024 * 1024);
        
        if (fileSizeMB > MAX_FILE_SIZE_MB) {
          console.log(`Removing large file (${fileSizeMB.toFixed(2)} MB): ${fullPath}`);
          fs.unlinkSync(fullPath);
        }
        
        // Also remove any .pack files regardless of size
        if (entry.name.endsWith('.pack')) {
          console.log(`Removing .pack file: ${fullPath}`);
          fs.unlinkSync(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${directory}:`, error);
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
  console.log('Starting Cloudflare deployment cleanup...');
  
  if (!fs.existsSync(DEPLOY_DIR)) {
    console.error(`Deployment directory doesn't exist: ${DEPLOY_DIR}`);
    console.log('Please run the build process first.');
    process.exit(1);
  }
  
  // Remove pattern-matched files
  removePatternFiles();
  
  // Remove large files
  removeLargeFiles(DEPLOY_DIR);
  
  // Create a report of the largest remaining files
  createSizeReport();
  
  console.log('\nCloudflare deployment cleanup complete!');
}

// Run the script
main();
