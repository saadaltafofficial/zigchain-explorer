This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, set up your environment variables:

```bash
# Create a .env file in the root directory with the following variables
RPC_URL=http://localhost:26657
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deployment

### Deploy on Cloudflare Pages

To deploy this application on Cloudflare Pages, follow these steps:

1. **Build the optimized distribution**:
   ```bash
   # Build the optimized distribution for GitHub deployment
   npm run build:github
   ```
   This will create a `dist` directory with all the optimized files.

2. **Push to GitHub**:
   ```bash
   # Create a new repository for the distribution files
   cd dist
   git init
   git add .
   git commit -m "Add pre-built distribution files"
   git remote add origin https://github.com/yourusername/zigchain-explorer-dist.git
   git push -u origin main
   ```

3. **Connect to Cloudflare Pages**:
   - Go to Cloudflare Pages dashboard
   - Create a new project and connect your GitHub repository
   - In the build settings, set:
     - Framework preset: None
     - Build command: (leave empty)
     - Build output directory: `/`
     - Root directory: `/`
   - Deploy!

This approach avoids the build size limitations by using pre-built files.
