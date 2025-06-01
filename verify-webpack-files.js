/**
 * Verify Essential Webpack Files
 * 
 * This script checks if all essential webpack files are present in the deployment directory
 * and reports any missing files that might cause 404 errors in the browser.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const DEPLOY_DIR = path.join(__dirname, 'cloudflare-deploy');

// Essential webpack files patterns
const ESSENTIAL_PATTERNS = [
  '_next/static/chunks/webpack-*.js',
  '_next/static/chunks/main-*.js',
  '_next/static/chunks/pages/_app-*.js',
  '_next/static/chunks/framework-*.js',
  '_next/static/chunks/polyfills-*.js',
  '_next/static/chunks/react-refresh.js',
  '_next/static/chunks/app-*.js',
  '_next/static/css/*.css'
];

/**
 * Check if files matching a pattern exist
 */
function checkPattern(pattern) {
  const fullPattern = path.join(DEPLOY_DIR, pattern);
  
  try {
    const files = glob.sync(fullPattern);
    return {
      pattern,
      exists: files.length > 0,
      count: files.length,
      files: files.map(f => path.relative(DEPLOY_DIR, f))
    };
  } catch (error) {
    console.error(`Error checking pattern ${pattern}:`, error);
    return {
      pattern,
      exists: false,
      count: 0,
      files: []
    };
  }
}

/**
 * Main function
 */
function main() {
  console.log('Verifying essential webpack files...');
  
  if (!fs.existsSync(DEPLOY_DIR)) {
    console.error(`Deployment directory doesn't exist: ${DEPLOY_DIR}`);
    console.log('Please run the build process first.');
    process.exit(1);
  }
  
  // Check each essential pattern
  const results = ESSENTIAL_PATTERNS.map(checkPattern);
  
  // Display results
  console.log('\nResults:');
  console.log('-------');
  
  let allGood = true;
  
  results.forEach(result => {
    if (result.exists) {
      console.log(`✅ ${result.pattern}: ${result.count} file(s) found`);
      if (result.count <= 3) {
        // Show the actual files if there aren't too many
        result.files.forEach(file => console.log(`   - ${file}`));
      }
    } else {
      console.log(`❌ ${result.pattern}: No files found`);
      allGood = false;
    }
  });
  
  console.log('\nSummary:');
  if (allGood) {
    console.log('✅ All essential webpack files are present!');
  } else {
    console.log('❌ Some essential webpack files are missing!');
    console.log('This may cause 404 errors in the browser.');
    console.log('Consider running the build process again or checking your cleanup scripts.');
  }
}

// Run the script
main();
