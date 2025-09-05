import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyMobileToken } from '@/lib/auth/mobile-jwt';

const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  platform: z.enum(['ios', 'android'], { message: 'Platform must be ios or android' }),
  pushToken: z.string().optional(),
  appVersion: z.string().min(1, 'App version is required'),
  osVersion: z.string().min(1, 'OS version is required'),
});

const NotificationPreferencesSchema = z.object({
  general: z.boolean().default(true),
  prayerRequests: z.boolean().default(true),
  announcements: z.boolean().default(true),
  events: z.boolean().default(true),
  pathways: z.boolean().default(true),
});

/**
 * POST /api/v2/notifications/register
 * Register device for push notifications
 * 
 * Implements PRD requirements:
 * - Register device with platform-specific tokens
 * - Store notification preferences
 * - Android channels: General, Prayer Requests, Announcements
 * - iOS categories with actions (RSVP, Mark as Prayed)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify mobile JWT token
    const tokenResult = await verifyMobileToken(request);
    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 401 }
      );
    }

    const { user } = tokenResult;

    // Parse and validate request body
    const body = await request.json();
    const deviceData = RegisterDeviceSchema.parse(body);
    const preferences = NotificationPreferencesSchema.parse(body.preferences || {});

    // Store device information (you'll need to create this table)
    // For now, we'll use a simple in-memory store or database
    const deviceRecord = {
      id: generateDeviceId(),
      userId: user.sub,
      tenantId: user.tenantId,
      deviceId: deviceData.deviceId,
      platform: deviceData.platform,
      pushToken: deviceData.pushToken,
      appVersion: deviceData.appVersion,
      osVersion: deviceData.osVersion,
      preferences,
      isActive: true,
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    // TODO: Store in database
    // await prisma.mobileDevice.upsert({
    //   where: { userId_deviceId: { userId: user.sub, deviceId: deviceData.deviceId } },
    //   update: deviceRecord,
    //   create: deviceRecord,
    // });

    // Set up platform-specific notification channels/categories
    const platformConfig = setupPlatformNotifications(deviceData.platform);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: deviceRecord.id,
        platform: deviceData.platform,
        preferences,
        platformConfig,
        registeredAt: deviceRecord.registeredAt,
      },
    });

  } catch (error) {
    console.error('Device registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Validation error: ${error.errors[0].message}` 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/notifications/register
 * Get current device registration and preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Verify mobile JWT token
    const tokenResult = await verifyMobileToken(request);
    if (!tokenResult.success) {
      return NextResponse.json(
        { success: false, error: tokenResult.error },
        { status: 401 }
      );
    }

    const { user } = tokenResult;
    const deviceId = request.nextUrl.searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get from database
    // const device = await prisma.mobileDevice.findFirst({
    //   where: { userId: user.sub, deviceId, isActive: true }
    // });

    // Mock response for now
    const device = {
      id: 'mock-id',
      platform: 'ios' as const,
      preferences: {
        general: true,
        prayerRequests: true,
        announcements: true,
        events: true,
        pathways: true,
      },
      registeredAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: device,
    });

  } catch (error) {
    console.error('Get device registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function setupPlatformNotifications(platform: 'ios' | 'android') {
  if (platform === 'android') {
    return {
      channels: [
        {
          id: 'general',
          name: 'General Notifications',
          description: 'General church notifications and updates',
          importance: 'default',
        },
        {
          id: 'prayer_requests',
          name: 'Prayer Requests',
          description: 'Prayer request notifications',
          importance: 'high',
        },
        {
          id: 'announcements',
          name: 'Announcements',
          description: 'Important church announcements',
          importance: 'high',
        },
      ],
    };
  } else {
    return {
      categories: [
        {
          id: 'RSVP',
          actions: [
            { id: 'rsvp_yes', title: 'Going', foreground: true },
            { id: 'rsvp_no', title: 'Not Going', foreground: false },
          ],
        },
        {
          id: 'PRAYER',
          actions: [
            { id: 'mark_prayed', title: 'Mark as Prayed', foreground: false },
            { id: 'view_request', title: 'View Request', foreground: true },
          ],
        },
      ],
    };
  }
}