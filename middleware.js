import { NextResponse } from 'next/server';

export function middleware(request) {
  // Clone the response
  const response = NextResponse.next();
  
  // Define CSP header based on environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Set Content-Security-Policy header
  const cspHeader = isDevelopment
    ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' ws: wss: http: https:;"
    : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' http: https:;";
  
  // Add the header to the response
  response.headers.set('Content-Security-Policy', cspHeader);
  
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ (image files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};
