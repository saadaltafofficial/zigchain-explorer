# ZigChain Explorer Deployment Guide

## Deploying to Cloudflare Pages Using Pre-built Distribution

This guide explains how to deploy the ZigChain Explorer to Cloudflare Pages using a pre-built distribution approach to avoid build size limitations.

### Step 1: Build the Optimized Distribution

```bash
# Make sure you're in the project root directory
cd d:\Projects\zigchain-explorer

# Run the build script to create the optimized distribution
pnpm run build:github
```

This will create a `dist` directory with all the optimized files, including:
- The Next.js static export
- Cloudflare Functions for API proxying
- Compressed JavaScript files
- Configuration files for Cloudflare Pages

### Step 2: Create a Separate GitHub Repository for Distribution

```bash
# Navigate to the dist directory
cd dist

# Initialize a new Git repository
git init

# Add all files to the repository
git add .

# Commit the files
git commit -m "Add pre-built ZigChain Explorer distribution"

# Add your GitHub repository as the remote
# Replace 'yourusername' with your actual GitHub username
git remote add origin https://github.com/yourusername/zigchain-explorer-dist.git

# Push to GitHub
git push -u origin main
```

### Step 3: Connect to Cloudflare Pages

1. Go to the [Cloudflare Pages dashboard](https://dash.cloudflare.com/?to=/:account/pages)
2. Click "Create a project"
3. Connect your GitHub account if you haven't already
4. Select the repository you created in Step 2
5. Configure the build settings:
   - **Project name**: `zigscan` (or your preferred name)
   - **Production branch**: `main`
   - **Framework preset**: None
   - **Build command**: (leave empty)
   - **Build output directory**: `/`
   - **Root directory**: `/`
   - **Environment variables**: (none needed as they're built into the code)
6. Click "Save and Deploy"

### Step 4: Configure Custom Domain

1. After deployment completes, go to the "Custom domains" tab
2. Click "Set up a custom domain"
3. Enter your domain (e.g., `zigscan.org`)
4. Follow the instructions to verify domain ownership and configure DNS

### Step 5: Verify Deployment

1. Visit your Cloudflare Pages URL or custom domain
2. Check that the ZigChain Explorer loads correctly
3. Verify that API requests are correctly going to `zigscan.net/api`
4. Test the blockchain data loading functionality

## Updating the Deployment

When you need to update the deployment:

1. Make changes to your source code repository
2. Run the build script again: `pnpm run build:github`
3. Navigate to the dist directory: `cd dist`
4. Commit and push the changes:
   ```bash
   git add .
   git commit -m "Update ZigChain Explorer distribution"
   git push
   ```
5. Cloudflare Pages will automatically deploy the updated version

## Troubleshooting

### API Connection Issues

If you encounter API connection issues:

1. Check the browser console for CORS errors
2. Verify that `apiClient.ts` is correctly configured to use `https://zigscan.net/api`
3. Ensure Cloudflare Functions are properly deployed

### Build Size Issues

If you still encounter build size issues:

1. Check the Cloudflare Pages deployment logs
2. Look for any large files that weren't properly excluded
3. Update the build script to remove those files

### Cloudflare Pages Configuration

If Cloudflare Pages is still trying to build your project instead of using the pre-built files:

1. Verify that the `.cloudflare/pages.toml` file is present in your repository
2. Check that the build command is empty in the Cloudflare Pages dashboard
3. Ensure the build output directory is set to `/`
