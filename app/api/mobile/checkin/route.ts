import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkInSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  isNewBeliever: z.boolean().default(false),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    accuracy: z.number().optional()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
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
    const { serviceId, isNewBeliever, location } = checkInSchema.parse(body)

    // Verify service exists and user has access
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        localChurchId: session.user.tenantId || undefined
      },
      select: {
        id: true,
        localChurchId: true,
        date: true,
        localChurch: {
          select: {
            name: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service not found or access denied',
          code: 'SERVICE_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Check if already checked in
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        serviceId_userId: {
          serviceId,
          userId: session.user.id
        }
      }
    })

    if (existingCheckin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Already checked in for this service',
          code: 'ALREADY_CHECKED_IN',
          data: {
            checkin: {
              id: existingCheckin.id,
              checkedInAt: existingCheckin.checkedInAt,
              isNewBeliever: existingCheckin.isNewBeliever
            }
          }
        },
        { status: 409 }
      )
    }

    // Create check-in
    const checkin = await prisma.checkin.create({
      data: {
        serviceId,
        userId: session.user.id,
        isNewBeliever
      }
    })

    // Handle new believer logic
    if (isNewBeliever) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { isNewBeliever: true }
      })

      // Auto-enroll in ROOTS pathway
      const rootsPathway = await prisma.pathway.findFirst({
        where: {
          type: 'ROOTS',
          tenantId: session.user.tenantId || undefined
        }
      })

      if (rootsPathway) {
        await prisma.pathwayEnrollment.create({
          data: {
            pathwayId: rootsPathway.id,
            userId: session.user.id
          }
        }).catch(() => {
          // Ignore duplicate enrollment errors
        })
      }
    }

    // Store location data if provided (for future analytics)
    if (location) {
      const locationKey = `checkin_location_${checkin.id}`
      await prisma.keyValue.create({
        key: locationKey,
        value: JSON.stringify({
          checkinId: checkin.id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // Location storage is optional, don't fail checkin if it fails
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        checkin: {
          id: checkin.id,
          serviceId: checkin.serviceId,
          checkedInAt: checkin.checkedInAt,
          isNewBeliever: checkin.isNewBeliever
        },
        service: {
          id: service.id,
          date: service.date,
          churchName: service.localChurch.name
        },
        message: isNewBeliever 
          ? 'Welcome! You\'ve been automatically enrolled in the ROOTS pathway.' 
          : 'Check-in successful!'
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

    console.error('Mobile checkin error:', error)
    
    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Already checked in for this service',
          code: 'ALREADY_CHECKED_IN'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check in',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}