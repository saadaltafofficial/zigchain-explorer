/**
 * Inject Runtime Fix Script
 * 
 * This script injects the runtime-fix.js into all HTML files in the build output
 * and creates necessary redirects for Cloudflare Pages.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const BUILD_DIR = '.next';
const RUNTIME_FIX_FILE = 'runtime-fix.js';

console.log('🔧 Starting runtime fix injection...');

// 1. Copy runtime-fix.js to the build output
function copyRuntimeFix() {
  const sourcePath = path.join(__dirname, RUNTIME_FIX_FILE);
  const destPath = path.join(BUILD_DIR, RUNTIME_FIX_FILE);
  
  try {
    if (!fs.existsSync(sourcePath)) {
      console.error(`❌ Runtime fix file not found at ${sourcePath}`);
      process.exit(1);
    }
    
    const content = fs.readFileSync(sourcePath, 'utf8');
    fs.writeFileSync(destPath, content, 'utf8');
    console.log(`✅ Copied ${RUNTIME_FIX_FILE} to ${destPath}`);
  } catch (error) {
    console.error(`❌ Error copying runtime fix: ${error.message}`);
    process.exit(1);
  }
}

// 2. Inject runtime-fix.js into all HTML files
function injectRuntimeFix() {
  try {
    // Find all HTML files in the build output
    const htmlFiles = glob.sync('**/*.html', { cwd: BUILD_DIR, absolute: true });
    
    if (htmlFiles.length === 0) {
      console.warn('⚠️ No HTML files found in build output');
      return;
    }
    
    console.log(`Found ${htmlFiles.length} HTML files to process`);
    
    // Process each HTML file
    htmlFiles.forEach(filePath => {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Check if runtime fix is already injected
      if (content.includes(RUNTIME_FIX_FILE)) {
        console.log(`⏭️ Runtime fix already injected in ${path.relative(BUILD_DIR, filePath)}`);
        return;
      }
      
      // Inject runtime fix script before closing head tag
      const scriptTag = `<script src="/${RUNTIME_FIX_FILE}"></script>`;
      content = content.replace('</head>', `${scriptTag}\n</head>`);
      
      // Write the modified content back to the file
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Injected runtime fix into ${path.relative(BUILD_DIR, filePath)}`);
    });
  } catch (error) {
    console.error(`❌ Error injecting runtime fix: ${error.message}`);
    process.exit(1);
  }
}

// 3. Create _redirects file for Cloudflare Pages
function createRedirects() {
  const redirectsPath = path.join(BUILD_DIR, '_redirects');
  const redirectsContent = `
# Handle all routes for Next.js
/*    /index.html   200

# Serve runtime fix script
/runtime-fix.js    /runtime-fix.js   200

# SPA fallback
/*    /index.html   404
`;
  
  try {
    fs.writeFileSync(redirectsPath, redirectsContent.trim(), 'utf8');
    console.log(`✅ Created _redirects file at ${redirectsPath}`);
  } catch (error) {
    console.error(`❌ Error creating _redirects file: ${error.message}`);
    process.exit(1);
  }
}

// Run all steps
copyRuntimeFix();
injectRuntimeFix();
createRedirects();

console.log('✅ Runtime fix injection complete!');
