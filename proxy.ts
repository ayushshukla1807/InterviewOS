import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/candidate(.*)',
  '/recruiter(.*)',
  '/founder(.*)',
  '/report(.*)',
  '/session(.*)',
  '/simulation(.*)',
  '/instructions(.*)',
  '/permissions(.*)'
]);

export default clerkMiddleware((auth, req) => {
  if (isProtectedRoute(req)) {
    const session = typeof auth === 'function' ? auth() : auth;
    // @ts-ignore
    if (!session.userId) {
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = host ? `${protocol}://${host}` : req.url;
      return NextResponse.redirect(new URL('/sign-in', baseUrl));
    }
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
