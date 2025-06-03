// Cloudflare Pages middleware for Next.js
// This handles routing for dynamic routes

export async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  
  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    return next();
  }
  
  // Forward all other requests to Next.js
  return next();
}
