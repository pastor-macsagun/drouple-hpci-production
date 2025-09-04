/**
 * Unified logout endpoint
 * POST /api/v1/auth/logout
 * Used by both Web and Mobile clients
 */

import { NextRequest, NextResponse } from 'next/server';
import { createApiResponse, createApiError, verifyJWT, revokeJWT } from '@/lib/middleware/auth';
import { refreshTokens } from '../login/route';

export async function POST(request: NextRequest) {
  try {
    // Get JWT payload to revoke the token
    const payload = await verifyJWT(request);
    
    if (payload) {
      // Add JTI to deny list
      revokeJWT(payload.jti);
    }

    // Clean up refresh tokens (simple approach - in production use proper key-value lookup)
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // In a real implementation, you'd map JWT JTI to refresh tokens
      // For now, we'll just revoke the current JWT
    }

    return NextResponse.json(
      createApiResponse(true, 'LOGOUT_SUCCESS', 'Logged out successfully'),
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      createApiError('INTERNAL_ERROR', 'Internal server error'),
      { status: 500 }
    );
  }
}