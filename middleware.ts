import { NextResponse, NextRequest } from "next/server"
import { getClientIp } from "@/lib/rate-limit"
import { checkRateLimitWithHeaders } from "@/lib/rate-limit-policies"
import { getSession } from "@/lib/edge/session-cookie"

export default async function middleware(req: NextRequest) {
  const session = await getSession(req)
  const isAuth = !!session
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard")
  const pathname = req.nextUrl.pathname
  const method = req.method

  // Apply endpoint-specific rate limiting in production
  if (process.env.NODE_ENV === 'production' || process.env.RATE_LIMIT_ENABLED === 'true') {
    const ip = getClientIp(req.headers)
    
    // Extract email from request body for auth endpoints (if applicable)
    let email: string | undefined
    if (method === 'POST' && pathname.startsWith('/api/auth')) {
      try {
        const clonedRequest = req.clone()
        const body = await clonedRequest.text()
        const params = new URLSearchParams(body)
        email = params.get('email') || params.get('username') || undefined
      } catch {
        // If we can't parse the body, continue without email
      }
    }
    
    // Check rate limit with new policy system
    const { allowed, headers, message } = await checkRateLimitWithHeaders(
      pathname,
      method,
      ip,
      email
    )
    
    // If rate limited, return 429 with proper headers
    if (!allowed) {
      return new NextResponse(message || 'Too many requests', {
        status: 429,
        headers: {
          'Content-Type': 'text/plain',
          ...headers
        }
      })
    }
    
    // Add rate limit headers to successful responses for transparency
    if (Object.keys(headers).length > 0) {
      const response = NextResponse.next()
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
  }

  // Authentication redirects
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