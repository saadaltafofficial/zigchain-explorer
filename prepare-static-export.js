const fs = require('fs');
const path = require('path');

// Paths to dynamic route folders
const dynamicRouteFolders = [
  'app/validators/[address]',
  'app/address/[address]',
  'app/blocks/[height]',
  'app/tx/[hash]'
];

// Function to rename folders (add .bak extension)
function renameFolders(folders, addBak = true) {
  folders.forEach(folder => {
    const fullPath = path.join(__dirname, folder);
    if (fs.existsSync(fullPath)) {
      const newPath = addBak ? `${fullPath}.bak` : fullPath.replace('.bak', '');
      if (addBak || fs.existsSync(`${fullPath}.bak`)) {
        console.log(`${addBak ? 'Temporarily moving' : 'Restoring'} ${folder}...`);
        fs.renameSync(addBak ? fullPath : `${fullPath}.bak`, newPath);
      }
    }
  });
}

// Determine action based on command line argument
const action = process.argv[2];

if (action === 'backup') {
  // Backup (rename) dynamic route folders before build
  console.log('Preparing for static export by temporarily moving dynamic routes...');
  renameFolders(dynamicRouteFolders, true);
} else if (action === 'restore') {
  // Restore dynamic route folders after build
  console.log('Restoring dynamic routes after static export...');
  renameFolders(dynamicRouteFolders, false);
} else {
  console.log('Please specify an action: "backup" or "restore"');
  process.exit(1);
}

console.log('Operation completed successfully!');
