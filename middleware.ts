import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/'];

// Define protected routes
const protectedRoutes = ['/audit', '/test-case', '/reports', '/documentation', '/report'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // If it's a protected route, we'll let the client-side handle it
  // since we can't access wallet state in middleware
  if (isProtectedRoute) {
    // The client-side ProtectedRoute component will handle the actual protection
    return NextResponse.next();
  }

  // For public routes, continue normally
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
