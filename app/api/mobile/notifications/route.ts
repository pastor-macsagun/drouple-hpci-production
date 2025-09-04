import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// For this implementation, we'll use the KeyValue store to manage notifications
// In a production system, you might want a dedicated notifications table

const createNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  category: z.enum(['general', 'event', 'lifegroup', 'pathway', 'checkin', 'admin']).default('general'),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
  expiresAt: z.string().datetime().optional()
})

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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const category = searchParams.get('category')

    // Get notifications for the user
    const notificationPrefix = `notification_${session.user.id}_`
    
    // Get all notification keys for this user
    const notificationKeys = await prisma.keyValue.findMany({
      where: {
        key: {
          startsWith: notificationPrefix
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse and filter notifications
    const notifications = notificationKeys
      .map(item => {
        try {
          const notification = JSON.parse(item.value)
          const notificationId = item.key.replace(notificationPrefix, '')
          
          return {
            id: notificationId,
            title: notification.title,
            message: notification.message,
            type: notification.type || 'info',
            category: notification.category || 'general',
            isRead: notification.isRead || false,
            readAt: notification.readAt || null,
            actionUrl: notification.actionUrl || null,
            actionText: notification.actionText || null,
            createdAt: notification.createdAt,
            expiresAt: notification.expiresAt || null
          }
        } catch (error) {
          console.error('Failed to parse notification:', error)
          return null
        }
      })
      .filter(notification => {
        if (!notification) return false
        
        // Filter expired notifications
        if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) {
          return false
        }
        
        // Filter by read status
        if (unreadOnly && notification.isRead) {
          return false
        }
        
        // Filter by category
        if (category && notification.category !== category) {
          return false
        }
        
        return true
      })
      .slice(offset, offset + limit)

    // Get counts for different categories
    const allNotifications = notificationKeys.map(item => {
      try {
        return JSON.parse(item.value)
      } catch {
        return null
      }
    }).filter(n => n && (!n.expiresAt || new Date(n.expiresAt) > new Date()))

    const unreadCount = allNotifications.filter(n => !n.isRead).length
    const categoryCounts = allNotifications.reduce((counts, notification) => {
      const cat = notification.category || 'general'
      counts[cat] = (counts[cat] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: allNotifications.length,
          limit,
          offset,
          hasMore: offset + limit < allNotifications.length
        },
        summary: {
          totalCount: allNotifications.length,
          unreadCount,
          categoryCounts
        }
      }
    })

  } catch (error) {
    console.error('Get notifications error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get notifications',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}

// Create a notification (for system use or admin)
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
    const notificationData = createNotificationSchema.parse(body)

    // Generate notification ID
    const notificationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Store notification
    const notificationKey = `notification_${session.user.id}_${notificationId}`
    
    await prisma.keyValue.create({
      key: notificationKey,
      value: JSON.stringify({
        ...notificationData,
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: session.user.id
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        id: notificationId,
        message: 'Notification created successfully'
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

    console.error('Create notification error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create notification',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    )
  }
}