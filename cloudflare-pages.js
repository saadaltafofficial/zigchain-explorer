/**
 * This script prepares the Next.js static export for Cloudflare Pages deployment
 * It creates the necessary Cloudflare Functions to replace the Next.js API routes
 */

const fs = require('fs');
const path = require('path');

// Create the functions directory structure
const functionsDir = path.join(__dirname, 'functions');
const apiFunctionsDir = path.join(functionsDir, 'api');

if (!fs.existsSync(functionsDir)) {
  fs.mkdirSync(functionsDir, { recursive: true });
}

if (!fs.existsSync(apiFunctionsDir)) {
  fs.mkdirSync(apiFunctionsDir, { recursive: true });
}

// Create the RPC proxy function
const rpcFunction = `// Cloudflare Pages Function to proxy RPC requests
export async function onRequest(context) {
  const { request } = context;
  
  try {
    // Default RPC URL with fallback
    const RPC_URL = context.env.RPC_URL || 'https://zigscan.net';
    
    // Extract path and search params
    const url = new URL(request.url);
    const { searchParams } = url;
    const path = searchParams.get('path') || '';
    // Remove 'path' from params for the real request
    searchParams.delete('path');
    
    // Special handling for transaction requests to fix the 0x prefix issue
    if (path === '/tx') {
      const txHash = searchParams.get('hash');
      console.log('[RPC PROXY] Original transaction hash:', txHash);
      
      // If the hash starts with 0x, remove it before sending to the RPC node
      if (txHash && txHash.startsWith('0x')) {
        const cleanHash = txHash.substring(2);
        console.log('[RPC PROXY] Removing 0x prefix, using hash:', cleanHash);
        searchParams.set('hash', cleanHash);
      }
    }
    
    const queryString = searchParams.toString();
    
    // Construct the URL - ensure we're using the correct format for zigscan.net
    let targetUrl = '';
    if (path === '/validators') {
      // Special handling for validators endpoint
      targetUrl = \`\${RPC_URL}/validators\`;
    } else if (path === '/status') {
      // Special handling for status endpoint
      targetUrl = \`\${RPC_URL}/status\`;
    } else {
      // Default handling for other endpoints
      targetUrl = \`\${RPC_URL}\${path.startsWith('/') ? path : '/' + path}\${queryString ? '?' + queryString : ''}\`;
    }
    
    console.log('[RPC PROXY] Fetching:', targetUrl);
    
    // Fetch from the real RPC endpoint with proper headers
    const rpcRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZigChain-Explorer/1.0'
      }
    });
    
    const body = await rpcRes.text();
    if (rpcRes.status !== 200) {
      console.error('[RPC PROXY] Non-200 response:', rpcRes.status, body);
    }
    
    return new Response(body, {
      status: rpcRes.status,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
    });
  } catch (err) {
    console.error('[RPC PROXY] Proxy error:', err);
    return new Response(JSON.stringify({ error: 'Proxy error', detail: String(err) }), {
      status: 502,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}`;

// Create the Turnstile verification function
const turnstileFunction = `// Cloudflare Pages Function to verify Turnstile tokens
export async function onRequest(context) {
  const { request } = context;
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  try {
    // Cloudflare Turnstile verification endpoint
    const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    // Get secret key from environment or use the default one
    const TURNSTILE_SECRET_KEY = context.env.TURNSTILE_SECRET_KEY || '0x4AAAAAABfltL9Uqbz7lyBC4Dydi485j7Y';
    
    // Only handle POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Parse the request body
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Missing token' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Verify the token with Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    
    // Add the user's IP address if available
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
    if (ip) {
      formData.append('remoteip', ip);
    }
    
    const result = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const outcome = await result.json();
    
    if (outcome.success) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      console.error('Turnstile verification failed:', outcome);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Verification failed',
        details: outcome['error-codes'] 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}`;

// Create the _routes.json file for Cloudflare Pages
const routesConfig = {
  "version": 1,
  "include": ["/*"],
  "exclude": ["/_next/*", "/static/*", "/images/*"],
  "routes": [
    { "src": "/api/rpc", "dest": "/api/rpc" },
    { "src": "/api/verify-turnstile", "dest": "/api/verify-turnstile" }
  ]
};

// Write the files
fs.writeFileSync(path.join(apiFunctionsDir, 'rpc.js'), rpcFunction);
fs.writeFileSync(path.join(apiFunctionsDir, 'verify-turnstile.js'), turnstileFunction);
fs.writeFileSync(path.join(functionsDir, '_routes.json'), JSON.stringify(routesConfig, null, 2));

// Create a _redirects file for Cloudflare Pages
const redirectsContent = `# Redirects for Cloudflare Pages
/api/rpc/* /api/rpc 200
/api/verify-turnstile/* /api/verify-turnstile 200
/* /index.html 200`;

// Create a public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the _redirects file
fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent);

console.log('Cloudflare Pages deployment files created successfully!');
