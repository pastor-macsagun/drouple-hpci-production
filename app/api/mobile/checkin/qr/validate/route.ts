import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfDay, endOfDay } from 'date-fns'

const qrValidateSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
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
    const { qrCode } = qrValidateSchema.parse(body)

    // Parse QR code format - expecting format like: "service:{serviceId}:{churchId}:{timestamp}"
    // Or simple format: "service:{serviceId}"
    const qrParts = qrCode.split(':')
    
    if (qrParts.length < 2 || qrParts[0] !== 'service') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid QR code format',
          code: 'INVALID_QR_CODE'
        },
        { status: 400 }
      )
    }

    const serviceId = qrParts[1]
    const expectedChurchId = qrParts[2] // Optional church validation
    const qrTimestamp = qrParts[3] // Optional timestamp validation

    // Verify service exists and user has access
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        ...(session.user.tenantId && {
          localChurchId: session.user.tenantId
        })
      },
      include: {
        localChurch: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true
          }
        },
        _count: {
          select: {
            checkins: true
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

    // Additional validation: check if QR code includes church ID and verify it matches
    if (expectedChurchId && expectedChurchId !== service.localChurchId) {
      return NextResponse.json(
        {
          success: false,
          error: 'QR code is for a different church',
          code: 'CHURCH_MISMATCH'
        },
        { status: 403 }
      )
    }

    // Optional: Validate QR code timestamp (e.g., QR codes expire after 24 hours)
    if (qrTimestamp) {
      const qrDate = new Date(parseInt(qrTimestamp))
      const now = new Date()
      const hoursDiff = (now.getTime() - qrDate.getTime()) / (1000 * 60 * 60)
      
      if (hoursDiff > 24) {
        return NextResponse.json(
          {
            success: false,
            error: 'QR code has expired',
            code: 'QR_CODE_EXPIRED'
          },
          { status: 410 }
        )
      }
    }

    // Check if service is for today (optional validation)
    const today = new Date()
    const serviceDate = new Date(service.date)
    const isToday = serviceDate >= startOfDay(today) && serviceDate <= endOfDay(today)

    // Check if already checked in
    const existingCheckin = await prisma.checkin.findUnique({
      where: {
        serviceId_userId: {
          serviceId,
          userId: session.user.id
        }
      }
    })

    const response = {
      success: true,
      data: {
        service: {
          id: service.id,
          date: service.date,
          isToday,
          attendanceCount: service._count.checkins,
          church: {
            id: service.localChurch.id,
            name: service.localChurch.name,
            address: service.localChurch.address,
            city: service.localChurch.city,
            state: service.localChurch.state
          }
        },
        validation: {
          isValid: true,
          canCheckIn: !existingCheckin,
          alreadyCheckedIn: !!existingCheckin,
          checkedInAt: existingCheckin?.checkedInAt || null
        },
        message: existingCheckin 
          ? 'Already checked in for this service'
          : 'QR code validated successfully - ready to check in'
      }
    }

    return NextResponse.json(response)

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

    console.error('QR code validation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate QR code',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}