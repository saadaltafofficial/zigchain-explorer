// Cloudflare Pages Function to proxy RPC requests
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
      targetUrl = `${RPC_URL}/validators`;
    } else if (path === '/status') {
      // Special handling for status endpoint
      targetUrl = `${RPC_URL}/status`;
    } else {
      // Default handling for other endpoints
      targetUrl = `${RPC_URL}${path.startsWith('/') ? path : '/' + path}${queryString ? '?' + queryString : ''}`;
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
}