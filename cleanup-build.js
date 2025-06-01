const fs = require('fs');
const path = require('path');

// Paths to clean up
const PATHS_TO_REMOVE = [
  'out/cache',                // Remove webpack cache
  'out/.next/cache',          // Remove Next.js cache in .next
  'out/_next/cache',          // Remove Next.js cache
];

// Function to delete a directory recursively
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call for directories
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    // Delete the empty directory
    fs.rmdirSync(folderPath);
    console.log(`Removed: ${folderPath}`);
  }
}

// Function to check file size and remove if too large
function checkAndRemoveLargeFiles(directory, maxSizeMB = 20) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  let largeFilesRemoved = 0;
  
  function processDir(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        processDir(filePath); // Recursively process subdirectories
      } else {
        if (stats.size > maxSizeBytes) {
          console.log(`Removing large file: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
          fs.unlinkSync(filePath);
          largeFilesRemoved++;
        }
      }
    });
  }
  
  processDir(directory);
  console.log(`Removed ${largeFilesRemoved} files larger than ${maxSizeMB} MB`);
}

// Main cleanup function
function cleanupBuild() {
  console.log('Starting build cleanup...');
  
  // Remove specified paths
  PATHS_TO_REMOVE.forEach(pathToRemove => {
    const fullPath = path.join(__dirname, pathToRemove);
    if (fs.existsSync(fullPath)) {
      console.log(`Removing: ${pathToRemove}`);
      deleteFolderRecursive(fullPath);
    }
  });
  
  // Check for and remove any files larger than 20MB
  const outDir = path.join(__dirname, 'out');
  checkAndRemoveLargeFiles(outDir, 20);
  
  console.log('Build cleanup completed!');
}

// Run the cleanup
cleanupBuild();
