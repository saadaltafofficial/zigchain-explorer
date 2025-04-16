import { NextRequest } from 'next/server';

const RPC_URL = process.env.RPC_URL || 'https://zigscan.net/';

export async function GET(request: NextRequest) {
  try {
    // Extract path and search params
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    // Remove 'path' from params for the real request
    searchParams.delete('path');
    const queryString = searchParams.toString();
    const url = `${RPC_URL}${path.startsWith('/') ? path : '/' + path}${queryString ? '?' + queryString : ''}`;
    console.log('[RPC PROXY] Fetching:', url);
    // Fetch from the real RPC endpoint (no Content-Type header for GET)
    const rpcRes = await fetch(url, {
      method: 'GET',
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