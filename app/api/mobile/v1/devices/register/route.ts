/**
 * Mobile Device Registration API
 * POST /api/mobile/v1/devices/register - Register device for push notifications
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withMobileAuth, createMobileResponse, handleMobileApiError } from '@/lib/mobile-auth';
import { registerDevice } from '@/lib/notifications/service';
import type { DeviceRegisterRequest } from '@drouple/contracts';

// Validation schema
const DeviceRegisterSchema = z.object({
  token: z.string(),
  platform: z.enum(['ios', 'android']),
  appVersion: z.string().optional(),
}) satisfies z.ZodType<DeviceRegisterRequest>;

/**
 * POST /api/mobile/v1/devices/register
 * Register a device for push notifications
 */
export async function POST(request: NextRequest) {
  return withMobileAuth(request, async (req, user) => {
    try {
      // Parse and validate request body
      const body = await req.json();
      const result = DeviceRegisterSchema.safeParse(body);

      if (!result.success) {
        return createMobileResponse(
          { 
            error: 'Invalid request data',
            details: result.error.errors,
          },
          400
        );
      }

      const { token, platform, appVersion } = result.data;

      // Register device using notification service
      const registrationResult = await registerDevice(
        user.sub,
        token,
        platform,
        appVersion
      );

      if (!registrationResult.success) {
        return createMobileResponse(
          { error: registrationResult.error },
          400
        );
      }

      return createMobileResponse({
        status: 'ok' as const,
        message: 'Device registered successfully',
        deviceToken: token.slice(-8), // Return last 8 chars for confirmation
      });

    } catch (error) {
      return handleMobileApiError(error);
    }
  });
}