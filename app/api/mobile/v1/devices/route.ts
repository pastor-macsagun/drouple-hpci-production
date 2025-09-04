import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { ratelimit } from '@/lib/rate-limit';

const prisma = new PrismaClient();

const registerDeviceSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().min(1, 'App version is required'),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    osVersion: z.string().optional(),
    deviceModel: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'anonymous';
    const rateLimitResult = await ratelimit.limit(`device_register:${ip}`);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = registerDeviceSchema.parse(body);

    // Upsert device registration
    const device = await prisma.device.upsert({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform: validatedData.platform,
        },
      },
      update: {
        pushToken: validatedData.pushToken,
        appVersion: validatedData.appVersion,
        deviceInfo: validatedData.deviceInfo as any,
        updatedAt: new Date(),
        isActive: true,
      },
      create: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        pushToken: validatedData.pushToken,
        platform: validatedData.platform,
        appVersion: validatedData.appVersion,
        deviceInfo: validatedData.deviceInfo as any,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: device.id,
        platform: device.platform,
        registeredAt: device.createdAt,
      },
    });
  } catch (error) {
    console.error('Device registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const devices = await prisma.device.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        platform: true,
        appVersion: true,
        createdAt: true,
        updatedAt: true,
        deviceInfo: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Get devices error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve devices' },
      { status: 500 }
    );
  }
}