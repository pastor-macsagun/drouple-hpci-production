'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'
import { getCurrentUser, createTenantWhereClause, hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { rateLimiter } from '@/lib/rate-limiter'

// Thread-based messaging for US-COM-005, US-COM-006

const createThreadSchema = z.object({
  participants: z.array(z.string()).min(1, 'At least one participant required').max(10, 'Maximum 10 participants allowed'),
  initialMessage: z.string().min(1, 'Initial message is required').max(5000, 'Message too long')
})

const sendThreadMessageSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long')
})

export async function createMessageThread(formData: FormData) {
  // 1. Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can create threads
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to create message threads')
  }

  // 3. Rate limiting - prevent thread spam
  const rateLimitResult = await rateLimiter.checkLimit(user.id, 'API')
  if (!rateLimitResult.allowed) {
    redirect('/messages?error=rate_limited')
  }

  // 4. Input validation
  const participantIds = JSON.parse(formData.get('participants') as string || '[]')
  const rawData = {
    participants: participantIds,
    initialMessage: formData.get('initialMessage') as string
  }

  let validated
  try {
    validated = createThreadSchema.parse(rawData)
  } catch (error) {
    apiLogger.warn('Invalid thread creation data', { error, userId: user.id })
    redirect('/messages?error=validation_failed')
  }

  // 5. Tenant isolation - verify all participants are in same tenant
  const tenantWhereClause = await createTenantWhereClause(user)
  const participants = await prisma.user.findMany({
    where: {
      id: { in: validated.participants },
      ...tenantWhereClause
    }
  })

  if (participants.length !== validated.participants.length) {
    redirect('/messages?error=invalid_participants')
  }

  try {
    // Find user's membership to get localChurchId
    const membership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        leftAt: null // Active memberships
      }
    })

    if (!membership) {
      return { success: false, error: 'User membership not found' }
    }

    // Create thread with participants and initial message in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the thread
      const thread = await tx.messageThread.create({
        data: {
          localChurchId: membership.localChurchId,
          createdBy: user.id
        }
      })

      // Add all participants (including creator)
      const participantSet = new Set([user.id, ...validated.participants])
      const allParticipants = Array.from(participantSet)
      await tx.messageParticipant.createMany({
        data: allParticipants.map(participantId => ({
          threadId: thread.id,
          userId: participantId
        }))
      })

      // Send initial message
      const message = await tx.messageThreadMessage.create({
        data: {
          threadId: thread.id,
          authorId: user.id,
          body: validated.initialMessage
        }
      })

      return { thread, message }
    })

    apiLogger.info('Message thread created', {
      threadId: result.thread.id,
      createdBy: user.id,
      participantCount: validated.participants.length + 1
    })

    revalidatePath('/messages')
    return { success: true, threadId: result.thread.id }
  } catch (error) {
    apiLogger.error('Failed to create message thread', { error, userId: user.id })
    return { success: false, error: 'Failed to create thread' }
  }
}

export async function sendThreadMessage(formData: FormData) {
  // 1. Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can send thread messages
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to send messages')
  }

  // 3. Rate limiting - prevent message spam
  const rateLimitResult = await rateLimiter.checkLimit(user.id, 'API')
  if (!rateLimitResult.allowed) {
    redirect('/messages?error=rate_limited')
  }

  // 4. Input validation
  const rawData = {
    threadId: formData.get('threadId') as string,
    content: formData.get('content') as string
  }

  let validated
  try {
    validated = sendThreadMessageSchema.parse(rawData)
  } catch (error) {
    apiLogger.warn('Invalid thread message data', { error, userId: user.id })
    redirect(`/messages/${rawData.threadId}?error=validation_failed`)
  }

  // 5. Tenant isolation - verify user is participant in thread
  const participation = await prisma.messageParticipant.findFirst({
    where: {
      threadId: validated.threadId,
      userId: user.id
    },
    include: {
      thread: {
        include: {
          creator: { select: { tenantId: true } }
        }
      }
    }
  })

  if (!participation || participation.thread.creator.tenantId !== user.tenantId) {
    redirect('/messages?error=thread_not_found')
  }

  try {
    const message = await prisma.messageThreadMessage.create({
      data: {
        threadId: validated.threadId,
        authorId: user.id,
        body: validated.content
      }
    })

    // Update thread's updatedAt timestamp
    await prisma.messageThread.update({
      where: { id: validated.threadId },
      data: { updatedAt: new Date() }
    })

    apiLogger.info('Thread message sent', {
      messageId: message.id,
      threadId: validated.threadId,
      authorId: user.id
    })

    revalidatePath(`/messages/${validated.threadId}`)
    return { success: true, messageId: message.id }
  } catch (error) {
    apiLogger.error('Failed to send thread message', { error, threadId: validated.threadId, userId: user.id })
    return { success: false, error: 'Failed to send message' }
  }
}

export async function getMessageThreads() {
  // 1. Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can view threads
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to view message threads')
  }

  try {
    // Get threads where user is a participant with latest message and unread count
    const threads = await prisma.messageThread.findMany({
      where: {
        participants: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        creator: {
          select: { name: true, image: true }
        },
        participants: {
          include: {
            user: {
              select: { name: true, image: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            author: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: {
            messages: {
              where: {
                reads: {
                  none: {
                    userId: user.id
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    return {
      success: true,
      data: threads.map(thread => ({
        id: thread.id,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        creator: thread.creator,
        participants: thread.participants.map(p => p.user),
        latestMessage: thread.messages[0] || null,
        unreadCount: thread._count.messages
      }))
    }
  } catch (error) {
    apiLogger.error('Failed to get message threads', { error, userId: user.id })
    return {
      success: false,
      error: 'Failed to load message threads'
    }
  }
}

export async function getThreadMessages(threadId: string) {
  // 1. Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can view thread messages
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to view messages')
  }

  // 3. Verify user is participant in thread
  const participation = await prisma.messageParticipant.findFirst({
    where: {
      threadId,
      userId: user.id
    }
  })

  if (!participation) {
    redirect('/messages?error=thread_not_found')
  }

  try {
    const messages = await prisma.messageThreadMessage.findMany({
      where: {
        threadId
      },
      include: {
        author: {
          select: { name: true, image: true }
        },
        reads: {
          include: {
            user: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    // Mark all messages as read for current user
    await prisma.messageRead.createMany({
      data: messages
        .filter(msg => !msg.reads.some(read => read.userId === user.id))
        .map(msg => ({
          messageId: msg.id,
          userId: user.id
        })),
      skipDuplicates: true
    })

    revalidatePath(`/messages/${threadId}`)

    return {
      success: true,
      data: messages.map(message => ({
        ...message,
        isRead: message.reads.some(read => read.userId === user.id),
        readBy: message.reads.map(read => read.user.name)
      }))
    }
  } catch (error) {
    apiLogger.error('Failed to get thread messages', { error, threadId, userId: user.id })
    return {
      success: false,
      error: 'Failed to load messages'
    }
  }
}

export async function getAvailableParticipants() {
  // 1. Authentication check  
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can view participants
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to view participants')
  }

  try {
    // Get all active members in user's church(es) except self
    const tenantWhereClause = await createTenantWhereClause(user)
    
    const participants = await prisma.user.findMany({
      where: {
        ...tenantWhereClause,
        id: { not: user.id }, // Exclude self
        memberships: {
          some: {
            leftAt: null // Active memberships only
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true
      },
      orderBy: { name: 'asc' }
    })

    return {
      success: true,
      data: participants
    }
  } catch (error) {
    apiLogger.error('Failed to get available participants', { error, userId: user.id })
    return {
      success: false,
      error: 'Failed to load participants'
    }
  }
}