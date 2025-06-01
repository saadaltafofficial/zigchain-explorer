#!/bin/bash

# Cloudflare Pages build script for Next.js
echo "Starting build process for Cloudflare Pages..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the Next.js application
echo "Building Next.js application..."
npm run build

# Create the required output structure for Cloudflare Pages
echo "Preparing output for Cloudflare Pages..."

# Ensure the output directory exists
mkdir -p .cloudflare/

# Copy the build output to the expected location
cp -r .next/* .cloudflare/

echo "Build completed successfully!"
