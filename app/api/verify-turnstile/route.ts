import { NextRequest, NextResponse } from 'next/server';

// Cloudflare Turnstile verification endpoint
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
// Your secret key from Cloudflare Turnstile
const TURNSTILE_SECRET_KEY = '0x4AAAAAABfltL9Uqbz7lyBC4Dydi485j7Y';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    // Verify the token with Cloudflare
    const formData = new URLSearchParams();
    formData.append('secret', TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    
    // Add the user's IP address if available
    const ip = request.headers.get('x-forwarded-for');
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
      return NextResponse.json({ success: true });
    } else {
      console.error('Turnstile verification failed:', outcome);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Verification failed',
          details: outcome['error-codes']
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
