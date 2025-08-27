'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { apiLogger } from '@/lib/logger'

const sendMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  subject: z.string().optional(),
  content: z.string().min(1, 'Message content is required')
})

export async function sendMessage(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const rawData = {
    recipientId: formData.get('recipientId') as string,
    subject: formData.get('subject') as string || undefined,
    content: formData.get('content') as string
  }

  const validated = sendMessageSchema.parse(rawData)

  // Check recipient exists and is in same tenant
  const recipient = await prisma.user.findFirst({
    where: {
      id: validated.recipientId,
      tenantId: session.user.tenantId
    }
  })

  if (!recipient) {
    redirect('/messages/compose?error=invalid_recipient')
  }

  try {
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId: validated.recipientId,
        subject: validated.subject,
        content: validated.content
      }
    })

    apiLogger.info('Message sent', {
      messageId: message.id,
      senderId: session.user.id,
      recipientId: validated.recipientId
    })

    revalidatePath('/messages')
    redirect(`/messages/${message.id}?sent=true`)
  } catch (error) {
    apiLogger.error('Failed to send message', { error, senderId: session.user.id })
    redirect('/messages/compose?error=send_failed')
  }
}

export async function replyToMessage(messageId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const content = formData.get('content') as string
  if (!content) {
    redirect(`/messages/${messageId}?error=empty_reply`)
  }

  // Get original message
  const originalMessage = await prisma.message.findFirst({
    where: {
      id: messageId,
      OR: [
        { senderId: session.user.id },
        { recipientId: session.user.id }
      ]
    }
  })

  if (!originalMessage) {
    redirect('/messages?error=message_not_found')
  }

  // Determine recipient (reply to sender if we're the recipient, or to recipient if we're the sender)
  const recipientId = originalMessage.senderId === session.user.id 
    ? originalMessage.recipientId 
    : originalMessage.senderId

  try {
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        content,
        parentMessageId: messageId
      }
    })

    apiLogger.info('Reply sent', {
      parentMessageId: messageId,
      senderId: session.user.id,
      recipientId
    })

    revalidatePath(`/messages/${messageId}`)
    redirect(`/messages/${messageId}`)
  } catch (error) {
    apiLogger.error('Failed to send reply', { error, messageId })
    redirect(`/messages/${messageId}?error=reply_failed`)
  }
}

export async function markAsRead(messageId: string) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  await prisma.message.updateMany({
    where: {
      OR: [
        { id: messageId },
        { parentMessageId: messageId }
      ],
      recipientId: session.user.id,
      isRead: false
    },
    data: {
      isRead: true,
      readAt: new Date()
    }
  })

  revalidatePath('/messages')
  revalidatePath(`/messages/${messageId}`)
}