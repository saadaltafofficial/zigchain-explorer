const fs = require('fs');
const path = require('path');

// Function to recursively delete a directory
function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call
        deleteFolderRecursive(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

// Function to copy files recursively
function copyFolderRecursiveSync(source, target) {
  // Check if folder needs to be created or integrated
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach((file) => {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        // Recursive call
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        // Copy file
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

// Main function to prepare the build for Cloudflare Pages
async function prepareCloudflareDeployment() {
  console.log('Preparing build for Cloudflare Pages...');

  // 1. Make sure the out directory exists
  if (!fs.existsSync('./out')) {
    console.error('Error: The "out" directory does not exist. Run next build && next export first.');
    process.exit(1);
  }

  // 2. Copy Cloudflare Functions to the out directory
  if (fs.existsSync('./functions')) {
    console.log('Copying Cloudflare Functions to out directory...');
    copyFolderRecursiveSync('./functions', './out/functions');
  }

  // 3. Create _routes.json in the out directory if it doesn't exist
  if (!fs.existsSync('./out/_routes.json')) {
    console.log('Creating _routes.json in out directory...');
    const routesConfig = {
      "version": 1,
      "include": ["/*"],
      "exclude": ["/_next/*", "/static/*", "/images/*"],
      "routes": [
        { "src": "/api/rpc", "dest": "/api/rpc" },
        { "src": "/api/verify-turnstile", "dest": "/api/verify-turnstile" }
      ]
    };
    fs.writeFileSync('./out/_routes.json', JSON.stringify(routesConfig, null, 2));
  }

  // 4. Create a simple _redirects file for Cloudflare Pages
  console.log('Creating _redirects file...');
  const redirectsContent = `# Redirects for Cloudflare Pages
/api/rpc/* /api/rpc 200
/api/verify-turnstile/* /api/verify-turnstile 200
/* /index.html 200`;
  fs.writeFileSync('./out/_redirects', redirectsContent);

  console.log('Build preparation for Cloudflare Pages completed successfully!');
}

// Run the main function
prepareCloudflareDeployment().catch(err => {
  console.error('Error preparing build:', err);
  process.exit(1);
});
