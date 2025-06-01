// Cloudflare Pages Function to verify Turnstile tokens
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
}