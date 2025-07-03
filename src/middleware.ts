import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = path === '/login';
  
  // Get the auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  
  // Redirect logic
  if (!authToken && !isPublicPath) {
    // If not authenticated and trying to access protected route, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (authToken && isPublicPath) {
    // If authenticated and trying to access login page, redirect to dashboard
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
