import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const pushRegistrationSchema = z.object({
  pushToken: z.string().min(1, 'Push token is required'),
  platform: z.enum(['ios', 'android']),
  deviceId: z.string().min(1, 'Device ID is required'),
  preferences: z.object({
    events: z.boolean().default(true),
    lifegroups: z.boolean().default(true),
    pathways: z.boolean().default(true),
    checkins: z.boolean().default(true),
    announcements: z.boolean().default(true),
    general: z.boolean().default(true)
  }).default({
    events: true,
    lifegroups: true,
    pathways: true,
    checkins: true,
    announcements: true,
    general: true
  })
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const registrationData = pushRegistrationSchema.parse(body)

    // Store push token with user association
    const pushTokenKey = `push_token_${registrationData.pushToken}`
    const userPushKey = `user_push_${session.user.id}_${registrationData.deviceId}`

    // Store push token -> user mapping
    await prisma.keyValue.upsert({
      where: { key: pushTokenKey },
      update: {
        value: JSON.stringify({
          userId: session.user.id,
          deviceId: registrationData.deviceId,
          platform: registrationData.platform,
          preferences: registrationData.preferences,
          lastUpdated: new Date().toISOString(),
          isActive: true
        })
      },
      create: {
        key: pushTokenKey,
        value: JSON.stringify({
          userId: session.user.id,
          deviceId: registrationData.deviceId,
          platform: registrationData.platform,
          preferences: registrationData.preferences,
          registeredAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          isActive: true
        })
      }
    })

    // Store user -> push token mapping for easy lookup
    await prisma.keyValue.upsert({
      where: { key: userPushKey },
      update: {
        value: JSON.stringify({
          pushToken: registrationData.pushToken,
          platform: registrationData.platform,
          preferences: registrationData.preferences,
          lastUpdated: new Date().toISOString(),
          isActive: true
        })
      },
      create: {
        key: userPushKey,
        value: JSON.stringify({
          pushToken: registrationData.pushToken,
          platform: registrationData.platform,
          preferences: registrationData.preferences,
          registeredAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          isActive: true
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Push token registered successfully',
        pushToken: registrationData.pushToken,
        deviceId: registrationData.deviceId,
        platform: registrationData.platform,
        preferences: registrationData.preferences,
        registeredAt: new Date().toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Push token registration error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register push token',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Get user's push registration settings
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    // Get all push registrations for this user
    const userPushPrefix = `user_push_${session.user.id}_`
    const pushRegistrations = await prisma.keyValue.findMany({
      where: {
        key: {
          startsWith: userPushPrefix
        }
      }
    })

    const registrations = pushRegistrations.map(registration => {
      try {
        const data = JSON.parse(registration.value)
        const deviceId = registration.key.replace(userPushPrefix, '')
        
        return {
          deviceId,
          pushToken: data.pushToken,
          platform: data.platform,
          preferences: data.preferences,
          isActive: data.isActive,
          registeredAt: data.registeredAt,
          lastUpdated: data.lastUpdated
        }
      } catch (error) {
        console.error('Failed to parse push registration:', error)
        return null
      }
    }).filter(reg => reg !== null && reg.isActive)

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        totalDevices: registrations.length
      }
    })

  } catch (error) {
    console.error('Get push registrations error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get push registrations',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Update push notification preferences
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    const updateSchema = z.object({
      deviceId: z.string().min(1, 'Device ID is required'),
      preferences: z.object({
        events: z.boolean().optional(),
        lifegroups: z.boolean().optional(),
        pathways: z.boolean().optional(),
        checkins: z.boolean().optional(),
        announcements: z.boolean().optional(),
        general: z.boolean().optional()
      })
    })

    const { deviceId, preferences } = updateSchema.parse(body)

    const userPushKey = `user_push_${session.user.id}_${deviceId}`
    
    // Get existing registration
    const existingRegistration = await prisma.keyValue.findUnique({
      where: { key: userPushKey }
    })

    if (!existingRegistration) {
      return NextResponse.json(
        {
          success: false,
          error: 'Push registration not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    const existingData = JSON.parse(existingRegistration.value)
    
    // Update preferences
    const updatedData = {
      ...existingData,
      preferences: {
        ...existingData.preferences,
        ...preferences
      },
      lastUpdated: new Date().toISOString()
    }

    await prisma.keyValue.update({
      where: { key: userPushKey },
      data: {
        value: JSON.stringify(updatedData)
      }
    })

    // Also update the push token mapping
    const pushTokenKey = `push_token_${existingData.pushToken}`
    await prisma.keyValue.update({
      where: { key: pushTokenKey },
      data: {
        value: JSON.stringify(updatedData)
      }
    }).catch(() => {
      // Don't fail if push token key doesn't exist
    })

    return NextResponse.json({
      success: true,
      data: {
        deviceId,
        preferences: updatedData.preferences,
        message: 'Push notification preferences updated successfully'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Update push preferences error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update push preferences',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}