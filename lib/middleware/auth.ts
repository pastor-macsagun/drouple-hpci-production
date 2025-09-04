import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

export type JWTPayload = {
  sub: string;
  roles: string[];
  tenantId: string;
  jti: string;
  exp: number;
  iat: number;
};

export type ApiResponse<T = unknown> = {
  ok: boolean;
  code?: string;
  message?: string;
  data?: T;
  meta?: {
    traceId?: string;
  };
};

export function createApiResponse<T>(
  success: boolean,
  code?: string,
  message?: string,
  data?: T,
  meta?: { traceId?: string }
): ApiResponse<T> {
  return {
    ok: success,
    ...(code && { code }),
    ...(message && { message }),
    ...(data && { data }),
    ...(meta && { meta }),
  };
}

export function createApiError(
  code: string,
  message: string,
  meta?: { traceId?: string }
): ApiResponse {
  return createApiResponse(false, code, message, undefined, meta);
}

// Simple in-memory JWT deny list (in production, use Redis)
const jwtDenyList = new Set<string>();

export function revokeJWT(jti: string): void {
  jwtDenyList.add(jti);
}

export function isJWTRevoked(jti: string): boolean {
  return jwtDenyList.has(jti);
}

export async function verifyJWT(request: NextRequest): Promise<JWTPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return null;
    }

    const payload = jwt.verify(token, secret) as JWTPayload;

    // Check if token is revoked
    if (isJWTRevoked(payload.jti)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function requireAuth() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const payload = await verifyJWT(request);
    
    if (!payload) {
      return NextResponse.json(
        createApiError('UNAUTHORIZED', 'Invalid or expired token'),
        { status: 401 }
      );
    }

    // Attach user info to request (Next.js way)
    (request as any).user = payload;
    return null; // Continue to next middleware/handler
  };
}

export function requireRole(...allowedRoles: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const payload = await verifyJWT(request);
    
    if (!payload) {
      return NextResponse.json(
        createApiError('UNAUTHORIZED', 'Invalid or expired token'),
        { status: 401 }
      );
    }

    const hasRole = payload.roles.some(role => allowedRoles.includes(role));
    if (!hasRole) {
      return NextResponse.json(
        createApiError('FORBIDDEN', 'Insufficient permissions'),
        { status: 403 }
      );
    }

    (request as any).user = payload;
    return null;
  };
}

export function withTenant() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const payload = await verifyJWT(request);
    
    if (!payload) {
      return NextResponse.json(
        createApiError('UNAUTHORIZED', 'Invalid or expired token'),
        { status: 401 }
      );
    }

    (request as any).user = payload;
    (request as any).tenantId = payload.tenantId;
    return null;
  };
}

export async function runMiddleware(
  request: NextRequest,
  middlewares: Array<(req: NextRequest) => Promise<NextResponse | null>>
): Promise<NextResponse | null> {
  for (const middleware of middlewares) {
    const result = await middleware(request);
    if (result) {
      return result;
    }
  }
  return null;
}