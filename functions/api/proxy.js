// Cloudflare Pages Function to proxy all API requests to zigscan.net/api
export async function onRequest(context) {
  const { request } = context;
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  try {
    // Get the path from the request URL
    const url = new URL(request.url);
    const pathname = url.pathname.replace('/api', '');
    
    // Construct the target URL - directly to zigscan.net/api
    // We're removing the /api prefix from the pathname since it's already included in the target URL
    const targetUrl = `https://zigscan.net/api${pathname}${url.search}`;
    console.log('[API PROXY] Proxying request to:', targetUrl);
    
    // Create a new request with the same method, headers, and body
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.clone().arrayBuffer() : undefined
    });
    
    // Forward the request to the target URL
    const response = await fetch(proxyRequest);
    
    // Get the response body
    const body = await response.arrayBuffer();
    
    // Create a new response with CORS headers
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('[API PROXY] Error:', error);
    return new Response(JSON.stringify({ error: 'Proxy error', message: error.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}
