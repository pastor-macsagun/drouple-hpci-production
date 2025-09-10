'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getCurrentUser, hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { apiLogger } from '@/lib/logger'

export async function getNotifications() {
  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // RBAC enforcement - only MEMBER and above can view notifications
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to view notifications')
  }

  try {
    // For now, return simple notification counts
    const unreadAnnouncements = 0
    const unreadMessages = 0

    // Get recent announcements (last 7 days)
    const recentAnnouncements = await prisma.announcement.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        isActive: true
      },
      include: {
        author: {
          select: { name: true }
        },
        reads: {
          where: { userId: user.id },
          select: { readAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Get recent messages in user's threads
    const recentThreadMessages = await prisma.messageThreadMessage.findMany({
      where: {
        thread: {
          participants: {
            some: {
              userId: user.id
            }
          }
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        authorId: { not: user.id } // Exclude own messages
      },
      include: {
        author: {
          select: { name: true }
        },
        thread: {
          include: {
            participants: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            }
          }
        },
        reads: {
          where: { userId: user.id },
          select: { readAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return {
      success: true,
      data: {
        summary: {
          unreadAnnouncements,
          unreadMessages,
          total: unreadAnnouncements + unreadMessages
        },
        recentActivity: [
          ...recentAnnouncements.map(announcement => ({
            id: announcement.id,
            type: 'announcement' as const,
            title: announcement.title,
            content: announcement.content.substring(0, 100) + '...',
            author: announcement.author.name,
            createdAt: announcement.createdAt,
            isRead: announcement.reads.length > 0
          })),
          ...recentThreadMessages.map(message => ({
            id: message.id,
            type: 'message' as const,
            title: `New message from ${message.author.name}`,
            content: message.body.substring(0, 100) + '...',
            author: message.author.name,
            createdAt: message.createdAt,
            isRead: message.reads.length > 0,
            threadId: message.threadId
          }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
    }
  } catch (error) {
    apiLogger.error('Failed to get notifications', { error, userId: user.id })
    return {
      success: false,
      error: 'Failed to load notifications'
    }
  }
}

export async function getNotificationPreferences() {
  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  try {
    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId: user.id }
    })

    return {
      success: true,
      data: preferences || {
        userId: user.id,
        emailEnabled: true,
        pushEnabled: false,
        announcementsEnabled: true,
        messagesEnabled: true,
        digestEnabled: false
      }
    }
  } catch (error) {
    apiLogger.error('Failed to get notification preferences', { error, userId: user.id })
    return {
      success: false,
      error: 'Failed to load preferences'
    }
  }
}

export async function updateNotificationPreferences(formData: FormData) {
  // Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // For now, just return success (placeholder implementation)
  return { success: true }
}