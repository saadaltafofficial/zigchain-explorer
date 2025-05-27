import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define a rate limit threshold
const MAX_REQUESTS_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// Store IP addresses and their request counts
const ipRequestCounts: Record<string, { count: number; timestamp: number }> = {};

// Check for suspicious patterns in the request
function isSuspiciousRequest(request: NextRequest): boolean {
  // Get client IP address
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const url = request.nextUrl.pathname;
  
  // Check if this is a known bot user agent
  const knownBotPatterns = [
    /bot/i, /crawl/i, /spider/i, /headless/i, /scrape/i, 
    /phantom/i, /selenium/i, /puppeteer/i
  ];
  const isKnownBot = knownBotPatterns.some(pattern => pattern.test(userAgent));
  
  // Check for missing or suspicious user agent
  const hasSuspiciousUserAgent = !userAgent || userAgent.length < 10;
  
  // Check for suspicious URL patterns (e.g., trying to access admin routes)
  const hasSuspiciousUrlPattern = /\/(admin|wp-admin|login|wp-login|phpmyadmin)/i.test(url);
  
  // Check for rate limiting
  const now = Date.now();
  const ipData = ipRequestCounts[ip];
  
  if (!ipData) {
    // First request from this IP
    ipRequestCounts[ip] = { count: 1, timestamp: now };
  } else if (now - ipData.timestamp > RATE_LIMIT_WINDOW) {
    // Reset counter if window has passed
    ipRequestCounts[ip] = { count: 1, timestamp: now };
  } else {
    // Increment counter
    ipRequestCounts[ip].count++;
  }
  
  // Check if rate limit exceeded
  const isRateLimitExceeded = ipData && ipData.count > MAX_REQUESTS_PER_MINUTE;
  
  // Clean up old entries every 5 minutes
  if (now % (5 * 60 * 1000) < 1000) {
    Object.keys(ipRequestCounts).forEach(key => {
      if (now - ipRequestCounts[key].timestamp > 5 * 60 * 1000) {
        delete ipRequestCounts[key];
      }
    });
  }
  
  // Return true if any suspicious pattern is detected
  return isKnownBot || hasSuspiciousUserAgent || hasSuspiciousUrlPattern || isRateLimitExceeded;
}

export function middleware(request: NextRequest) {
  // Skip for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api') || 
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.includes('.') // Static files like .js, .css, etc.
  ) {
    return NextResponse.next();
  }

  // Check if the request is suspicious
  const isSuspicious = isSuspiciousRequest(request);
  
  // Get the response
  const response = NextResponse.next();
  
  // Set a header to indicate if verification is needed
  // This will be used by the GlobalTurnstile component
  if (isSuspicious) {
    response.headers.set('x-verify-turnstile', 'true');
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
