import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Define protected routes
const protectedRoutes = ['/candidate', '/recruiter', '/founder', '/apply', '/simulation', '/instructions', '/session'];
const authRoutes = ['/login', '/signup'];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Check if route is protected
  const isProtected = protectedRoutes.some(route => path.startsWith(route));
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));

  // Extract token from cookies
  const token = req.cookies.get('interviewos_token')?.value;
  
  let userPayload = null;
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'interviewos_secret_2026');
      const { payload } = await jose.jwtVerify(token, secret);
      userPayload = payload;
    } catch (e) {
      // Invalid token
      req.cookies.delete('interviewos_token');
    }
  }

  // If user is not authenticated and trying to access protected route -> Redirect to login
  if (!userPayload && isProtected) {
    return NextResponse.redirect(new URL('/login?from=' + encodeURIComponent(path), req.url));
  }

  // If user is authenticated and trying to access login/signup -> Redirect to dashboard
  if (userPayload && isAuthRoute) {
    const role = userPayload.role as string;
    if (role === 'founder') return NextResponse.redirect(new URL('/founder', req.url));
    if (role === 'recruiter') return NextResponse.redirect(new URL('/recruiter', req.url));
    if (role === 'candidate') return NextResponse.redirect(new URL('/candidate', req.url));
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Strict cross-role guarding
  if (userPayload && isProtected) {
    const role = userPayload.role as string;
    
    // Founder has access to everything
    if (role === 'founder') return NextResponse.next();
    
    // Recruiter trying to access candidate stuff
    if (role === 'recruiter' && (path.startsWith('/candidate') || path.startsWith('/apply') || path.startsWith('/simulation'))) {
      return NextResponse.redirect(new URL('/recruiter', req.url));
    }
    
    // Candidate trying to access recruiter/founder stuff
    if (role === 'candidate' && (path.startsWith('/recruiter') || path.startsWith('/founder'))) {
      return NextResponse.redirect(new URL('/candidate', req.url));
    }
  }

  return NextResponse.next();
}

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
