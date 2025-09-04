import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { ApplicationError } from '@/lib/errors'

const deviceRegistrationSchema = z.object({
  deviceId: z.string().min(1, 'Device ID is required'),
  pushToken: z.string().min(1, 'Push token is required'),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
  osVersion: z.string().optional(),
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
    const deviceData = deviceRegistrationSchema.parse(body)

    // Store or update device registration
    // For now, we'll use a simple key-value store approach
    // In a production app, you might want a dedicated devices table
    const deviceKey = `device_${session.user.id}_${deviceData.deviceId}`
    
    await prisma.keyValue.upsert({
      where: { key: deviceKey },
      update: {
        value: JSON.stringify({
          userId: session.user.id,
          pushToken: deviceData.pushToken,
          platform: deviceData.platform,
          deviceName: deviceData.deviceName,
          appVersion: deviceData.appVersion,
          osVersion: deviceData.osVersion,
          lastSeen: new Date().toISOString(),
          isActive: true
        })
      },
      create: {
        key: deviceKey,
        value: JSON.stringify({
          userId: session.user.id,
          pushToken: deviceData.pushToken,
          platform: deviceData.platform,
          deviceName: deviceData.deviceName,
          appVersion: deviceData.appVersion,
          osVersion: deviceData.osVersion,
          registeredAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          isActive: true
        })
      }
    })

    // Also store a reverse lookup for push notifications
    const pushTokenKey = `push_token_${deviceData.pushToken}`
    await prisma.keyValue.upsert({
      where: { key: pushTokenKey },
      update: {
        value: JSON.stringify({
          userId: session.user.id,
          deviceId: deviceData.deviceId,
          platform: deviceData.platform,
          lastUpdated: new Date().toISOString()
        })
      },
      create: {
        key: pushTokenKey,
        value: JSON.stringify({
          userId: session.user.id,
          deviceId: deviceData.deviceId,
          platform: deviceData.platform,
          registeredAt: new Date().toISOString()
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Device registered successfully',
        deviceId: deviceData.deviceId,
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

    console.error('Device registration error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to register device',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve registered devices for the user
export async function GET(request: NextRequest) {
  try {
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

    // Find all devices for this user
    const devicePrefix = `device_${session.user.id}_`
    const devices = await prisma.keyValue.findMany({
      where: {
        key: {
          startsWith: devicePrefix
        }
      }
    })

    const parsedDevices = devices.map(device => {
      const deviceData = JSON.parse(device.value)
      const deviceId = device.key.replace(devicePrefix, '')
      
      return {
        deviceId,
        platform: deviceData.platform,
        deviceName: deviceData.deviceName,
        appVersion: deviceData.appVersion,
        osVersion: deviceData.osVersion,
        registeredAt: deviceData.registeredAt,
        lastSeen: deviceData.lastSeen,
        isActive: deviceData.isActive
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        devices: parsedDevices,
        count: parsedDevices.length
      }
    })

  } catch (error) {
    console.error('Get devices error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get devices',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}