import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin');
  
  // Create a response object (you can also just continue if not OPTIONS)
  const response = NextResponse.next();

  // Basic CORS headers
  // Note: For credentials to work, we cannot use '*'
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');

  // Handle preflight requests (OPTIONS)
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: response.headers,
    });
  }

  return response;
}

// Only apply to API routes
export const config = {
  matcher: '/api/:path*',
};
