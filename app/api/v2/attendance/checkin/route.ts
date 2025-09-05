import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const CheckinSchema = z.object({
  type: z.enum(['member', 'service']),
  entityId: z.string(),
  timestamp: z.string().datetime(),
});

/**
 * POST /api/v2/attendance/checkin
 * Record attendance check-in with idempotency
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: { code: 'BAD_REQUEST', message: 'Idempotency-Key header required' } },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = CheckinSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: validation.error.message } },
        { status: 400 }
      );
    }

    const { type, entityId, timestamp } = validation.data;

    // Check for existing checkin using service and user
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        serviceId_userId: {
          serviceId: entityId,
          userId: session.user.id
        }
      },
    });

    if (existingCheckin) {
      // Return the existing check-in
      return NextResponse.json({
        id: existingCheckin.id,
        type: type,
        entityId: entityId,
        timestamp: existingCheckin.checkedInAt,
        duplicate: true,
      });
    }

    // Create new check-in record
    const checkin = await prisma.checkin.create({
      data: {
        serviceId: entityId,
        userId: session.user.id,
        isNewBeliever: false, // Default for mobile checkin
        checkedInAt: new Date(timestamp),
      },
    });

    return NextResponse.json({
      id: checkin.id,
      type: type,
      entityId: entityId,
      timestamp: checkin.checkedInAt,
      duplicate: false,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}