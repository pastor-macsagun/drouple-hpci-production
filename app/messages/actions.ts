'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'
import { getCurrentUser, createTenantWhereClause, hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { rateLimiter } from '@/lib/rate-limiter'

const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  subject: z.string().max(200, 'Subject too long').optional(),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long')
})

const replyMessageSchema = z.object({
  content: z.string().min(1, 'Reply content is required').max(5000, 'Reply too long')
})

export async function sendMessage(formData: FormData) {
  // 1. Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can send messages
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to send messages')
  }

  // 3. Rate limiting - prevent message spam
  const rateLimitResult = await rateLimiter.checkLimit(user.id, 'API')
  if (!rateLimitResult.allowed) {
    redirect('/messages/compose?error=rate_limited')
  }

  // 4. Input validation
  const rawData = {
    recipientId: formData.get('recipientId') as string,
    subject: formData.get('subject') as string || undefined,
    content: formData.get('content') as string
  }

  let validated
  try {
    validated = sendMessageSchema.parse(rawData)
  } catch (error) {
    apiLogger.warn('Invalid message data', { error, senderId: user.id })
    redirect('/messages/compose?error=validation_failed')
  }

  // 5. Tenant isolation - check recipient exists and is in same tenant
  const tenantWhereClause = await createTenantWhereClause(user)
  const recipient = await prisma.user.findFirst({
    where: {
      id: validated.recipientId,
      ...tenantWhereClause
    }
  })

  if (!recipient) {
    redirect('/messages/compose?error=invalid_recipient')
  }

  try {
    const message = await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId: validated.recipientId,
        subject: validated.subject,
        content: validated.content
      }
    })

    apiLogger.info('Message sent', {
      messageId: message.id,
      senderId: user.id,
      recipientId: validated.recipientId
    })

    revalidatePath('/messages')
    return { success: true, messageId: message.id }
  } catch (error) {
    apiLogger.error('Failed to send message', { error, senderId: user.id })
    return { success: false, error: 'Failed to send message' }
  }
}

export async function replyToMessage(messageId: string, formData: FormData) {
  // 1. Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can reply to messages
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to reply to messages')
  }

  // 3. Rate limiting - prevent reply spam
  const rateLimitResult = await rateLimiter.checkLimit(user.id, 'API')
  if (!rateLimitResult.allowed) {
    redirect(`/messages/${messageId}?error=rate_limited`)
  }

  // 4. Input validation
  const rawData = {
    content: formData.get('content') as string
  }

  let validated
  try {
    validated = replyMessageSchema.parse(rawData)
  } catch (error) {
    apiLogger.warn('Invalid reply data', { error, senderId: user.id, messageId })
    redirect(`/messages/${messageId}?error=validation_failed`)
  }

  // 5. Tenant isolation - get original message with tenant scoping
  
  // Check if original message exists and user has access to it
  const originalMessage = await prisma.message.findFirst({
    where: {
      id: messageId,
      OR: [
        { senderId: user.id },
        { recipientId: user.id }
      ]
    },
    include: {
      sender: { select: { tenantId: true } },
      recipient: { select: { tenantId: true } }
    }
  })

  if (!originalMessage) {
    redirect('/messages?error=message_not_found')
  }

  // Ensure both sender and recipient are in same tenant as current user
  if (originalMessage.sender.tenantId !== user.tenantId || 
      originalMessage.recipient.tenantId !== user.tenantId) {
    throw new Error('Access denied: cross-tenant message access')
  }

  // Determine recipient (reply to sender if we're the recipient, or to recipient if we're the sender)
  const recipientId = originalMessage.senderId === user.id 
    ? originalMessage.recipientId 
    : originalMessage.senderId

  try {
    await prisma.message.create({
      data: {
        senderId: user.id,
        recipientId,
        content: validated.content,
        parentMessageId: messageId
      }
    })

    apiLogger.info('Reply sent', {
      parentMessageId: messageId,
      senderId: user.id,
      recipientId
    })

    revalidatePath(`/messages/${messageId}`)
    return { success: true }
  } catch (error) {
    apiLogger.error('Failed to send reply', { error, messageId })
    return { success: false, error: 'Failed to send reply' }
  }
}

export async function markAsRead(messageId: string) {
  // 1. Authentication check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // 2. RBAC enforcement - only MEMBER and above can mark messages as read
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to mark messages as read')
  }

  try {
    // 3. Tenant isolation - only update messages the user has access to
    await prisma.message.updateMany({
      where: {
        OR: [
          { id: messageId },
          { parentMessageId: messageId }
        ],
        recipientId: user.id, // User can only mark their own received messages as read
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    revalidatePath('/messages')
    revalidatePath(`/messages/${messageId}`)
    return { success: true }
  } catch (error) {
    apiLogger.error('Failed to mark message as read', { error, messageId, userId: user.id })
    return { success: false, error: 'Failed to mark message as read' }
  }
}