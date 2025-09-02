import { NextResponse } from "next/server"
import { getClientIp } from "@/lib/rate-limit"
import { checkRateLimitWithHeaders } from "@/lib/rate-limit-policies"
import { auth } from "@/lib/auth"

export default auth(async (req) => {
  const pathname = req.nextUrl.pathname
  const method = req.method
  
  // Get session from req.auth property (available in auth() wrapped middleware)
  const session = req.auth
  const isAuth = !!session
  const isAuthPage = pathname.startsWith("/auth")

  // Apply rate limiting in production
  if (process.env.NODE_ENV === 'production' || process.env.RATE_LIMIT_ENABLED === 'true') {
    const ip = getClientIp(req.headers)
    
    // Extract email from request body for auth endpoints
    let email: string | undefined
    if (method === 'POST' && pathname.startsWith('/api/auth')) {
      try {
        const clonedRequest = req.clone()
        const body = await clonedRequest.text()
        const params = new URLSearchParams(body)
        email = params.get('email') || params.get('username') || undefined
      } catch {
        // Continue without email if parsing fails
      }
    }
    
    const { allowed, headers, message } = await checkRateLimitWithHeaders(
      pathname,
      method,
      ip,
      email
    )
    
    if (!allowed) {
      return new NextResponse(message || 'Too many requests', {
        status: 429,
        headers: { 'Content-Type': 'text/plain', ...headers }
      })
    }
  }

  // Define public paths that don't require authentication
  const PUBLIC_PATHS = [
    /^\/$/,                    // Homepage
    /^\/auth\//,               // Auth pages
    /^\/api\/auth\//,          // Auth API routes
    /^\/api\/health/,          // Health check
  ]
  const isPublicPath = PUBLIC_PATHS.some(rx => rx.test(pathname))
  
  // Prevent redirect loops - never redirect if already on auth page
  if (isAuthPage) {
    return NextResponse.next()
  }
  
  // Redirect unauthenticated users to login (except public paths)
  if (!isAuth && !isPublicPath) {
    const url = new URL('/auth/signin', req.url)
    if (pathname !== '/') {
      url.searchParams.set('returnTo', pathname)
    }
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages (except change-password)
  if (isAuth && isAuthPage && !pathname.startsWith("/auth/change-password")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Role-based access control and redirects
  if (isAuth && session) {
    const userRole = session.user?.role
    const mustChangePassword = session.user?.mustChangePassword
    
    // Force password change (except on change-password page)
    if (mustChangePassword && !pathname.startsWith("/auth/change-password")) {
      return NextResponse.redirect(new URL("/auth/change-password", req.url))
    }
    
    // Redirect from home page to role-appropriate dashboard
    if (pathname === "/") {
      switch (userRole) {
        case "SUPER_ADMIN":
          return NextResponse.redirect(new URL("/super", req.url))
        case "ADMIN":
        case "PASTOR":
          return NextResponse.redirect(new URL("/admin", req.url))
        case "VIP":
          return NextResponse.redirect(new URL("/vip", req.url))
        case "LEADER":
          return NextResponse.redirect(new URL("/leader", req.url))
        case "MEMBER":
        default:
          return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
    
    // Basic role-based route protection
    if (pathname.startsWith("/super") && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    if (pathname.startsWith("/admin") && !["SUPER_ADMIN", "ADMIN", "PASTOR"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    if (pathname.startsWith("/vip") && !["SUPER_ADMIN", "ADMIN", "PASTOR", "VIP"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    if (pathname.startsWith("/leader") && !["SUPER_ADMIN", "ADMIN", "PASTOR", "VIP", "LEADER"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|api/auth|.well-known).*)",
  ],
}