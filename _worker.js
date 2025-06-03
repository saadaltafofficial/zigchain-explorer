export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    let pathname = url.pathname;
    
    // Add trailing slash for consistency if not present and not a file request
    if (!pathname.endsWith('/') && !pathname.includes('.')) {
      pathname = `${pathname}/`;
      url.pathname = pathname;
      return Response.redirect(url.toString(), 308);
    }
    
    // Handle API routes
    if (pathname.startsWith('/api/')) {
      // Pass to API function if it exists
      return env.ASSETS.fetch(request);
    }
    
    // For dynamic routes like /tx/[hash], /blocks/[height], etc.
    // We need to ensure the request is handled by Next.js
    try {
      // Try to serve the requested path directly
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // If that fails, try to serve the path + /index.html
      try {
        const indexRequest = new Request(
          `${url.origin}${pathname.endsWith('/') ? pathname : pathname + '/'}index.html`,
          request
        );
        return await env.ASSETS.fetch(indexRequest);
      } catch (e) {
        // If that fails too, serve the 404 page
        const notFoundRequest = new Request(`${url.origin}/404.html`, request);
        try {
          return await env.ASSETS.fetch(notFoundRequest);
        } catch (e) {
          // Last resort: return a simple 404 response
          return new Response('Not Found', { status: 404 });
        }
      }
    }
  }
};
