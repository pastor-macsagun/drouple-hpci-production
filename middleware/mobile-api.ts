/**
 * Mobile API Middleware
 * Handles JWT authorization, CORS, and rate limiting for /api/mobile/v1 routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/mobileAuth/verify';
import { rateLimiters, getClientIp } from '@/lib/rate-limit';
import type { Role } from '@drouple/contracts';

// Mobile app allowed origins from environment variable
const getMobileOrigins = (): (string | RegExp)[] => {
  const envOrigins = process.env.MOBILE_CORS_ORIGINS;
  if (!envOrigins) {
    // Fallback defaults for development and production
    return [
      'http://localhost:19006',  // Expo dev server default
      'http://127.0.0.1:19006', // Local IP variant
      /^exp:\/\/.*$/,           // Expo scheme pattern
      'https://www.drouple.app', // Production web app
      'https://api.drouple.app', // Production API app
      'https://mobile.drouple.app', // Production mobile app
      /^https:\/\/.*\.drouple\.app$/, // Other drouple.app subdomains
    ];
  }
  
  return envOrigins.split(',').map(origin => origin.trim()).map(origin => {
    // Convert expo:// and similar scheme patterns to regex
    if (origin.includes('exp://')) {
      return /^exp:\/\/.*$/;
    }
    // Convert wildcard domains to regex
    if (origin.includes('*.')) {
      const escaped = origin.replace(/\./g, '\\.').replace(/\*/g, '.*');
      return new RegExp(`^${escaped}$`);
    }
    return origin;
  });
};

const MOBILE_ORIGINS = getMobileOrigins();

// Request context attached to authenticated requests
export interface MobileRequestContext {
  userId: string;
  roles: Role[];
  tenantId: string;
  localChurchId?: string;
}

// Extend NextRequest to include context
declare global {
  namespace NodeJS {
    interface Global {
      mobileRequestContext?: MobileRequestContext;
    }
  }
}

/**
 * Check if origin is allowed for CORS
 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  return MOBILE_ORIGINS.some(allowedOrigin => {
    if (typeof allowedOrigin === 'string') {
      return origin === allowedOrigin;
    } else {
      return allowedOrigin.test(origin);
    }
  });
}

/**
 * Handle CORS preflight and add headers
 */
function handleCORS(request: NextRequest, origin: string | null): NextResponse | null {
  if (!isAllowedOrigin(origin)) {
    // For preflight requests, still respond but without allowing the origin
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403 }
    );
  }

  // Handle preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin!,
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Idempotency-Key, X-Local-Church-Id',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '300', // 5 minutes preflight cache
      },
    });
  }

  return null;
}

/**
 * Add CORS headers to response
 */
function addCORSHeaders(response: NextResponse, origin: string | null): void {
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin!);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Vary', 'Origin');
  }
}

/**
 * Check if route requires authentication (excludes /auth/* routes)
 */
function requiresAuth(pathname: string): boolean {
  return !pathname.startsWith('/api/mobile/v1/auth/');
}

/**
 * Check if route is a mutation endpoint (POST, PUT, PATCH, DELETE)
 */
function isMutationEndpoint(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * Apply rate limiting for mutation endpoints
 */
async function applyRateLimit(request: NextRequest, userId?: string): Promise<NextResponse | null> {
  if (!isMutationEndpoint(request.method)) {
    return null; // No rate limiting for read operations
  }

  const clientIp = getClientIp(request.headers);
  const rateLimitKey = userId 
    ? `mobile-mutation:${clientIp}:${userId}` 
    : `mobile-mutation:${clientIp}`;

  // Rate limit from environment variable or defaults
  const mobileRateLimit = parseInt(process.env.RATE_LIMIT_MOBILE || '60', 10);
  const limit = userId ? mobileRateLimit : Math.floor(mobileRateLimit / 6); // Unauthenticated gets 1/6th
  const rateLimitResult = await rateLimiters.api.check(rateLimitKey);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.reset.getTime() - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toISOString(),
        }
      }
    );
  }

  return null;
}

/**
 * Main mobile API middleware function
 */
export async function mobileApiMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');
  
  // Handle CORS
  const corsResponse = handleCORS(request, origin);
  if (corsResponse) {
    return corsResponse;
  }

  // Check if authentication is required
  const needsAuth = requiresAuth(pathname);
  let context: MobileRequestContext | undefined;

  if (needsAuth) {
    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    const authResult = await verifyAuthHeader(authHeader);

    if (!authResult.success) {
      const errorResponse = NextResponse.json(
        { error: authResult.error || 'Authentication required' },
        { status: 401 }
      );
      addCORSHeaders(errorResponse, origin);
      return errorResponse;
    }

    const payload = authResult.payload;

    // Validate tenant
    if (!payload.tenantId) {
      const errorResponse = NextResponse.json(
        { error: 'Tenant information missing' },
        { status: 403 }
      );
      addCORSHeaders(errorResponse, origin);
      return errorResponse;
    }

    // Create request context
    context = {
      userId: payload.userId,
      roles: payload.roles,
      tenantId: payload.tenantId,
      localChurchId: payload.localChurchId,
    };
  }

  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, context?.userId);
  if (rateLimitResponse) {
    addCORSHeaders(rateLimitResponse, origin);
    return rateLimitResponse;
  }

  // Continue to the API route
  const response = NextResponse.next();
  
  // Add CORS headers to successful responses
  addCORSHeaders(response, origin);

  // Attach context to request headers for API routes to access
  if (context) {
    response.headers.set('x-mobile-context', JSON.stringify(context));
  }

  return response;
}

