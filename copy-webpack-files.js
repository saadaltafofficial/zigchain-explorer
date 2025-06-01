/**
 * Copy Webpack Files Script
 * 
 * This script copies essential webpack files from the .next directory to the cloudflare-deploy directory
 * to ensure they're available for the browser.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const SOURCE_DIR = path.join(__dirname, '.next');
const DEPLOY_DIR = path.join(__dirname, 'cloudflare-deploy');

// Essential webpack file patterns to copy
const PATTERNS_TO_COPY = [
  // Webpack runtime files
  'static/chunks/webpack-*.js',
  'static/chunks/main-*.js',
  'static/chunks/framework-*.js',
  'static/chunks/polyfills-*.js',
  'static/chunks/app-*.js',
  'static/css/*.css',
  'static/media/*.*'
];

/**
 * Copy files matching a pattern
 */
function copyPattern(pattern) {
  const sourcePattern = path.join(SOURCE_DIR, pattern);
  
  try {
    const files = glob.sync(sourcePattern);
    
    if (files.length === 0) {
      console.log(`No files found for pattern: ${pattern}`);
      return { pattern, copied: 0, files: [] };
    }
    
    const copiedFiles = [];
    
    files.forEach(file => {
      const relativePath = path.relative(SOURCE_DIR, file);
      const destPath = path.join(DEPLOY_DIR, '_next', relativePath);
      
      // Create directory if it doesn't exist
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      
      // Copy the file
      fs.copyFileSync(file, destPath);
      copiedFiles.push(relativePath);
    });
    
    return { pattern, copied: copiedFiles.length, files: copiedFiles };
  } catch (error) {
    console.error(`Error copying pattern ${pattern}:`, error);
    return { pattern, copied: 0, files: [] };
  }
}

/**
 * Update HTML files to include the correct script references
 */
function updateHtmlFiles() {
  console.log('\nUpdating HTML files with correct script references...');
  
  const htmlFiles = glob.sync(path.join(DEPLOY_DIR, '**/*.html'));
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found to update.');
    return;
  }
  
  // Find the webpack runtime file
  const webpackFiles = glob.sync(path.join(DEPLOY_DIR, '_next/static/chunks/webpack-*.js'));
  const mainFiles = glob.sync(path.join(DEPLOY_DIR, '_next/static/chunks/main-*.js'));
  const frameworkFiles = glob.sync(path.join(DEPLOY_DIR, '_next/static/chunks/framework-*.js'));
  const polyfillFiles = glob.sync(path.join(DEPLOY_DIR, '_next/static/chunks/polyfills-*.js'));
  
  if (webpackFiles.length === 0 || mainFiles.length === 0 || frameworkFiles.length === 0) {
    console.log('Missing essential webpack files, cannot update HTML files.');
    return;
  }
  
  // Get the relative paths for the script files
  const webpackPath = '/_next/' + path.relative(path.join(DEPLOY_DIR, '_next'), webpackFiles[0]);
  const mainPath = '/_next/' + path.relative(path.join(DEPLOY_DIR, '_next'), mainFiles[0]);
  const frameworkPath = '/_next/' + path.relative(path.join(DEPLOY_DIR, '_next'), frameworkFiles[0]);
  const polyfillPath = polyfillFiles.length > 0 ? 
    '/_next/' + path.relative(path.join(DEPLOY_DIR, '_next'), polyfillFiles[0]) : null;
  
  // Update each HTML file
  let updatedCount = 0;
  
  htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if the file already has the webpack script
    if (content.includes('chunks/webpack-')) {
      return; // Skip this file, it already has the webpack script
    }
    
    // Add the scripts before the closing </body> tag
    const scriptTags = `\n<!-- Added by copy-webpack-files.js -->\n` +
      `<script src="${webpackPath}" defer></script>\n` +
      `<script src="${mainPath}" defer></script>\n` +
      `<script src="${frameworkPath}" defer></script>\n` +
      (polyfillPath ? `<script src="${polyfillPath}" defer></script>\n` : '') +
      `<!-- End added scripts -->\n`;
    
    content = content.replace('</body>', `${scriptTags}</body>`);
    
    // Write the updated content back to the file
    fs.writeFileSync(file, content);
    updatedCount++;
  });
  
  console.log(`Updated ${updatedCount} HTML files with script references.`);
}

/**
 * Main function
 */
function main() {
  console.log('Starting webpack files copy process...');
  
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory doesn't exist: ${SOURCE_DIR}`);
    console.log('Please run the build process first.');
    process.exit(1);
  }
  
  if (!fs.existsSync(DEPLOY_DIR)) {
    console.error(`Deployment directory doesn't exist: ${DEPLOY_DIR}`);
    console.log('Please run the build process first.');
    process.exit(1);
  }
  
  // Copy each pattern
  const results = PATTERNS_TO_COPY.map(copyPattern);
  
  // Display results
  console.log('\nResults:');
  console.log('-------');
  
  let totalCopied = 0;
  
  results.forEach(result => {
    console.log(`${result.pattern}: ${result.copied} file(s) copied`);
    if (result.copied > 0 && result.copied <= 5) {
      // Show the actual files if there aren't too many
      result.files.forEach(file => console.log(`   - ${file}`));
    }
    totalCopied += result.copied;
  });
  
  // Update HTML files with script references
  if (totalCopied > 0) {
    updateHtmlFiles();
  }
  
  console.log('\nSummary:');
  console.log(`Copied ${totalCopied} webpack files to the deployment directory.`);
  
  if (totalCopied === 0) {
    console.log('No webpack files were copied. Check if the build process generated the expected files.');
  } else {
    console.log('Webpack files successfully copied!');
  }
}

// Run the script
main();
