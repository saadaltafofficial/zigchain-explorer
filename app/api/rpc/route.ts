import { NextRequest } from 'next/server';

const RPC_URL = process.env.RPC_URL || 'http://167.86.79.37:26657';

export async function GET(request: NextRequest) {
  try {
    // Extract path and search params
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    // Build proxied URL
    const url = `${RPC_URL}${path.startsWith('/') ? path : '/' + path}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    // Fetch from the real RPC endpoint
    const rpcRes = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward user-agent etc if needed
      },
      // No credentials, no cookies
    });
    const body = await rpcRes.text();
    return new Response(body, {
      status: rpcRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', detail: String(err) }), { status: 502 });
  }
}