import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { mobileApiMiddleware } from '@/middleware/mobile-api';

export default withAuth(
  async function middleware(request: NextRequest) {
    // Handle mobile API v1 with dedicated middleware
    if (request.nextUrl.pathname.startsWith('/api/mobile/v1/')) {
      return mobileApiMiddleware(request);
    }

    // Continue with normal request processing for non-mobile routes
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Mobile API v1 routes don't use NextAuth sessions - they use JWT Bearer tokens
        if (req.nextUrl.pathname.startsWith('/api/mobile/v1/')) {
          return true; // Let the mobile auth middleware handle authentication
        }

        // Existing web auth logic
        if (req.nextUrl.pathname.startsWith('/api/')) {
          return !!token;
        }
        
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return token?.roles?.includes('ADMIN') || token?.roles?.includes('PASTOR');
        }
        
        if (req.nextUrl.pathname.startsWith('/super')) {
          return token?.roles?.includes('SUPER_ADMIN');
        }
        
        if (req.nextUrl.pathname.startsWith('/vip')) {
          return token?.roles?.includes('VIP') || 
                 token?.roles?.includes('ADMIN') || 
                 token?.roles?.includes('PASTOR');
        }
        
        if (req.nextUrl.pathname.startsWith('/leader')) {
          return token?.roles?.includes('LEADER') || 
                 token?.roles?.includes('VIP') ||
                 token?.roles?.includes('ADMIN') || 
                 token?.roles?.includes('PASTOR');
        }

        return !!token;
      },
    },
  }
);

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