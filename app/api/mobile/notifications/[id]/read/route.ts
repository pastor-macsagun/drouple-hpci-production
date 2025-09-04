import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const notificationId = params.id
    const notificationKey = `notification_${session.user.id}_${notificationId}`

    // Get the notification
    const notificationRecord = await prisma.keyValue.findUnique({
      where: { key: notificationKey }
    })

    if (!notificationRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    try {
      const notification = JSON.parse(notificationRecord.value)
      
      // Check if it's already read
      if (notification.isRead) {
        return NextResponse.json({
          success: true,
          data: {
            message: 'Notification already marked as read',
            readAt: notification.readAt
          }
        })
      }

      // Mark as read
      const updatedNotification = {
        ...notification,
        isRead: true,
        readAt: new Date().toISOString()
      }

      await prisma.keyValue.update({
        where: { key: notificationKey },
        data: {
          value: JSON.stringify(updatedNotification)
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: notificationId,
          readAt: updatedNotification.readAt,
          message: 'Notification marked as read'
        }
      })

    } catch (parseError) {
      console.error('Failed to parse notification:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid notification data',
          code: 'INVALID_DATA'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Mark notification as read error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark notification as read',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Mark notification as unread
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const notificationId = params.id
    const notificationKey = `notification_${session.user.id}_${notificationId}`

    // Get the notification
    const notificationRecord = await prisma.keyValue.findUnique({
      where: { key: notificationKey }
    })

    if (!notificationRecord) {
      return NextResponse.json(
        {
          success: false,
          error: 'Notification not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      )
    }

    try {
      const notification = JSON.parse(notificationRecord.value)
      
      // Mark as unread
      const updatedNotification = {
        ...notification,
        isRead: false,
        readAt: null
      }

      await prisma.keyValue.update({
        where: { key: notificationKey },
        data: {
          value: JSON.stringify(updatedNotification)
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          id: notificationId,
          message: 'Notification marked as unread'
        }
      })

    } catch (parseError) {
      console.error('Failed to parse notification:', parseError)
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid notification data',
          code: 'INVALID_DATA'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Mark notification as unread error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to mark notification as unread',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}