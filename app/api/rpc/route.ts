import { NextRequest } from 'next/server';

const RPC_URL = process.env.RPC_URL || 'https://zigscan.net';

export async function GET(request: NextRequest) {
  try {
    // Extract path and search params
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    // Remove 'path' from params for the real request
    searchParams.delete('path');
    const queryString = searchParams.toString();
    
    // Construct the URL - ensure we're using the correct format for zigscan.net
    let url = '';
    if (path === '/validators') {
      // Special handling for validators endpoint
      url = `${RPC_URL}/validators`;
    } else if (path === '/status') {
      // Special handling for status endpoint
      url = `${RPC_URL}/status`;
    } else {
      // Default handling for other endpoints
      url = `${RPC_URL}${path.startsWith('/') ? path : '/' + path}${queryString ? '?' + queryString : ''}`;
    }
    
    console.log('[RPC PROXY] Fetching:', url);
    
    // Fetch from the real RPC endpoint with proper headers
    const rpcRes = await fetch(url, {
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
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[RPC PROXY] Proxy error:', err);
    return new Response(JSON.stringify({ error: 'Proxy error', detail: String(err) }), { status: 502 });
  }
}