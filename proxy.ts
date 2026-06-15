import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Define protected routes
const protectedRoutes = [
  '/candidate', 
  '/recruiter', 
  '/founder', 
  '/apply', 
  '/simulation', 
  '/instructions', 
  '/session', 
  '/interview', 
  '/report', 
  '/feedback', 
  '/permissions', 
  '/select'
];
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
      
      // Verify active session against MongoDB Session collection
      if (isProtected) {
        const { connectDB } = await import('./lib/db/mongoose');
        const Session = (await import('./lib/db/models/Session')).default as any;
        await connectDB();
        const activeSession = await Session.findOne({
          userId: payload.id as string,
          token: token.split('.').pop() as string
        });
        if (!activeSession) {
          throw new Error('Session revoked');
        }
      }
      
      userPayload = payload;
    } catch (e) {
      // Invalid or revoked token
      const res = NextResponse.redirect(new URL('/login?from=' + encodeURIComponent(path), req.url));
      res.cookies.delete('interviewos_token');
      return res;
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
    
    // Recruiter trying to access candidate-only stuff
    if (
      role === 'recruiter' && (
        path.startsWith('/candidate') || 
        path.startsWith('/apply') || 
        path.startsWith('/simulation') ||
        path.startsWith('/instructions') ||
        path.startsWith('/session') ||
        path.startsWith('/interview')
      )
    ) {
      return NextResponse.redirect(new URL('/recruiter', req.url));
    }
    
    // Candidate trying to access recruiter/founder/system-only stuff
    if (
      role === 'candidate' && (
        path.startsWith('/recruiter') || 
        path.startsWith('/founder') ||
        path.startsWith('/report') ||
        path.startsWith('/permissions') ||
        path.startsWith('/select')
      )
    ) {
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
