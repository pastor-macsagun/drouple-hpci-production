/**
 * Mobile API Idempotency Utilities
 * Handles idempotent mutations via X-Idempotency-Key or clientRequestId
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { MobileRequestContext } from './context';

export interface IdempotencyResult<T = any> {
  isDuplicate: boolean;
  response?: T;
}

/**
 * Extract idempotency key from request
 * Checks X-Idempotency-Key header first, then clientRequestId from body
 */
export function getIdempotencyKey(request: NextRequest, body?: any): string | null {
  // Try X-Idempotency-Key header first
  const headerKey = request.headers.get('X-Idempotency-Key');
  if (headerKey) {
    return headerKey;
  }

  // Try clientRequestId from request body
  if (body?.clientRequestId && typeof body.clientRequestId === 'string') {
    return body.clientRequestId;
  }

  return null;
}

/**
 * Check if request is a duplicate based on idempotency key
 * Returns cached response if duplicate, null if new request
 */
export async function checkIdempotency<T = any>(
  idempotencyKey: string,
  userId: string,
  route: string
): Promise<IdempotencyResult<T>> {
  try {
    const existing = await db.mobileIdempotency.findUnique({
      where: {
        id: idempotencyKey,
      },
    });

    if (existing) {
      // Verify it's for the same user and route for security
      if (existing.userId !== userId || existing.route !== route) {
        throw new Error('Idempotency key conflict: different user or route');
      }

      return {
        isDuplicate: true,
        response: existing.response as T,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Idempotency check error:', error);
    // If there's an error checking idempotency, treat as new request
    return { isDuplicate: false };
  }
}

/**
 * Store successful response for idempotency
 */
export async function storeIdempotencyResponse<T = any>(
  idempotencyKey: string,
  userId: string,
  route: string,
  response: T
): Promise<void> {
  try {
    await db.mobileIdempotency.create({
      data: {
        id: idempotencyKey,
        userId,
        route,
        response: response as any, // Prisma Json type
      },
    });
  } catch (error) {
    // If storing fails, log but don't fail the request
    // The operation was already successful
    console.error('Failed to store idempotency response:', error);
  }
}

/**
 * Clean up old idempotency records (should be run periodically)
 * Removes records older than 24 hours
 */
export async function cleanupIdempotencyRecords(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  try {
    const result = await db.mobileIdempotency.deleteMany({
      where: {
        createdAt: {
          lt: oneDayAgo,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Failed to cleanup idempotency records:', error);
    return 0;
  }
}

/**
 * Wrapper for idempotent mutations
 * Handles checking, executing, and storing for idempotent operations
 */
export async function withIdempotency<T>(
  request: NextRequest,
  context: MobileRequestContext,
  route: string,
  body: any,
  operation: () => Promise<T>
): Promise<NextResponse> {
  const idempotencyKey = getIdempotencyKey(request, body);

  if (!idempotencyKey) {
    // No idempotency key provided, execute normally
    try {
      const result = await operation();
      return NextResponse.json(result);
    } catch (error) {
      console.error(`${route} operation failed:`, error);
      return NextResponse.json(
        { error: 'Operation failed' },
        { status: 500 }
      );
    }
  }

  // Check for duplicate request
  const idempotencyCheck = await checkIdempotency<T>(
    idempotencyKey,
    context.userId,
    route
  );

  if (idempotencyCheck.isDuplicate) {
    // Return cached response
    return NextResponse.json(idempotencyCheck.response);
  }

  // Execute the operation
  try {
    const result = await operation();

    // Store result for future idempotency checks
    await storeIdempotencyResponse(
      idempotencyKey,
      context.userId,
      route,
      result
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error(`${route} operation failed:`, error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}

/**
 * Validate idempotency key format
 * Should be a UUID or similar unique string
 */
export function isValidIdempotencyKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }

  // Check length (reasonable bounds)
  if (key.length < 8 || key.length > 128) {
    return false;
  }

  // Check for valid characters (alphanumeric, hyphens, underscores)
  const validPattern = /^[a-zA-Z0-9_-]+$/;
  return validPattern.test(key);
}