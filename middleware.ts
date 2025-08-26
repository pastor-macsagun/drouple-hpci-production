import { NextResponse, NextRequest } from "next/server"
import { rateLimiters, getClientIp } from "@/lib/rate-limit"
import { getSession } from "@/lib/edge/session-cookie"

export default async function middleware(req: NextRequest) {
  const session = await getSession(req)
  const isAuth = !!session
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const pathname = req.nextUrl.pathname

  // Apply rate limiting to sensitive endpoints
  if (process.env.NODE_ENV === 'production') {
    const ip = getClientIp(req.headers)
    
    // Strict rate limiting for auth endpoints
    if (pathname.startsWith('/auth') || pathname === '/register') {
      const rateLimitKey = rateLimiters.auth.key(['auth', ip])
      const { success, reset } = await rateLimiters.auth.check(rateLimitKey)
      
      if (!success) {
        return new NextResponse('Too many requests. Please try again later.', {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Limit': '3',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toISOString(),
          },
        })
      }
    }
    
    // General API rate limiting
    if (pathname.startsWith('/api')) {
      const rateLimitKey = rateLimiters.api.key(['api', ip])
      const { success, remaining, limit, reset } = await rateLimiters.api.check(rateLimitKey)
      
      if (!success) {
        return new NextResponse('API rate limit exceeded', {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((reset.getTime() - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': reset.toISOString(),
          },
        })
      }
    }
  }

  if (isDashboard && !isAuth) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  if (isAuthPage && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}