import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/me',
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/',
  '/session',
  '/simulation',
  '/candidate',
  '/recruiter',
  '/interview',
  '/report',
  '/feedback',
  '/instructions',
  '/permissions',
  '/apply',
  '/select',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all API routes except auth-gated ones
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // files with extensions (.svg, .ico, etc.)
  ) {
    return NextResponse.next();
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_ROUTES.some(
    route => pathname === route || pathname.startsWith(route + '/')
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const token = request.cookies.get('interviewos_token')?.value;

  if (!token) {
    // Redirect to login with return URL
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
