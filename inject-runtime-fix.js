/**
 * Inject Runtime Fix Script
 * 
 * This script injects the runtime-fix.js script into all HTML files in the deployment directory
 * to prevent 404 errors for missing webpack chunks.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Configuration
const DEPLOY_DIR = path.join(__dirname, 'cloudflare-deploy');
const RUNTIME_FIX_PATH = '/_next/static/runtime-fix.js';

/**
 * Copy essential files to the deployment directory
 */
function copyEssentialFiles() {
  // Copy runtime fix script
  const sourceFile = path.join(__dirname, 'public', 'runtime-fix.js');
  const destDir = path.join(DEPLOY_DIR, '_next', 'static');
  const destFile = path.join(destDir, 'runtime-fix.js');
  
  if (!fs.existsSync(sourceFile)) {
    console.error(`Runtime fix file not found: ${sourceFile}`);
    return false;
  }
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy the runtime fix file
  fs.copyFileSync(sourceFile, destFile);
  console.log(`Copied runtime fix to: ${destFile}`);
  
  // Copy _redirects file
  const redirectsSource = path.join(__dirname, '_redirects');
  const redirectsDest = path.join(DEPLOY_DIR, '_redirects');
  
  if (fs.existsSync(redirectsSource)) {
    fs.copyFileSync(redirectsSource, redirectsDest);
    console.log(`Copied _redirects to: ${redirectsDest}`);
  } else {
    console.log('_redirects file not found, creating it...');
    const redirectsContent = `/* /index.html 200
/404 /404.html 404`;
    fs.writeFileSync(redirectsDest, redirectsContent);
    console.log(`Created _redirects at: ${redirectsDest}`);
  }
  
  return true;
}

/**
 * Update HTML files to include the runtime fix script
 */
function updateHtmlFiles() {
  console.log('\nUpdating HTML files with runtime fix script...');
  
  // Use a more direct approach to find HTML files
  let htmlFiles = [];
  
  // First check the root directory
  try {
    const rootFiles = fs.readdirSync(DEPLOY_DIR);
    rootFiles.forEach(file => {
      if (file.endsWith('.html')) {
        htmlFiles.push(path.join(DEPLOY_DIR, file));
      }
    });
    
    // Then check subdirectories
    const dirs = fs.readdirSync(DEPLOY_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    dirs.forEach(dir => {
      const dirPath = path.join(DEPLOY_DIR, dir);
      
      // Skip _next directory
      if (dir === '_next') return;
      
      // Check if there's an index.html in this directory
      const indexPath = path.join(dirPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        htmlFiles.push(indexPath);
      }
      
      // Check for subdirectories (for dynamic routes)
      try {
        const subdirs = fs.readdirSync(dirPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        subdirs.forEach(subdir => {
          const subdirPath = path.join(dirPath, subdir);
          const subIndexPath = path.join(subdirPath, 'index.html');
          
          if (fs.existsSync(subIndexPath)) {
            htmlFiles.push(subIndexPath);
          }
        });
      } catch (err) {
        // Ignore errors for subdirectories
      }
    });
  } catch (err) {
    console.error('Error reading deployment directory:', err);
  }
  
  console.log(`Found ${htmlFiles.length} HTML files`);
  
  if (htmlFiles.length === 0) {
    console.log('No HTML files found to update.');
    return;
  }
  
  // Update each HTML file
  let updatedCount = 0;
  
  htmlFiles.forEach(file => {
    try {
      let content = fs.readFileSync(file, 'utf8');
      
      // Check if the file already has the runtime fix script
      if (content.includes('runtime-fix.js')) {
        console.log(`File already has runtime fix: ${file}`);
        return; // Skip this file, it already has the script
      }
      
      // Add the script at the beginning of the head tag
      const scriptTag = `<head>\n<script src="${RUNTIME_FIX_PATH}" defer></script>`;
      
      content = content.replace('<head>', scriptTag);
      
      // Write the updated content back to the file
      fs.writeFileSync(file, content);
      console.log(`Updated file: ${path.relative(DEPLOY_DIR, file)}`);
      updatedCount++;
    } catch (err) {
      console.error(`Error updating file ${file}:`, err);
    }
  });
  
  console.log(`Updated ${updatedCount} HTML files with runtime fix script.`);
}

/**
 * Main function
 */
function main() {
  console.log('Starting runtime fix injection...');
  
  if (!fs.existsSync(DEPLOY_DIR)) {
    console.error(`Deployment directory doesn't exist: ${DEPLOY_DIR}`);
    console.log('Please run the build process first.');
    process.exit(1);
  }
  
  // Copy essential files including runtime fix script and _redirects
  const copied = copyEssentialFiles();
  
  if (!copied) {
    console.error('Failed to copy essential files.');
    process.exit(1);
  }
  
  // Update HTML files
  updateHtmlFiles();
  
  console.log('\nRuntime fix injection complete!');
}

// Run the script
main();
