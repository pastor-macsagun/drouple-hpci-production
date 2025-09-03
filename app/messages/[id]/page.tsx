import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Circle, User } from 'lucide-react'
import Link from 'next/link'
import { markAsRead } from '../actions'
import { getCurrentUser, hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { ReplyForm } from './reply-form'

async function getMessage(
  messageId: string, 
  user: { id: string; tenantId: string | null }
) {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      OR: [
        { senderId: user.id },
        { recipientId: user.id }
      ]
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true, tenantId: true }
      },
      recipient: {
        select: { id: true, name: true, email: true, tenantId: true }
      },
      replies: {
        include: {
          sender: {
            select: { id: true, name: true, email: true, tenantId: true }
          },
          recipient: {
            select: { id: true, name: true, email: true, tenantId: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  // Tenant isolation check - ensure both sender and recipient are in same tenant
  if (message && 
      (message.sender.tenantId !== user.tenantId || 
       message.recipient.tenantId !== user.tenantId)) {
    return null // Hide cross-tenant messages
  }

  return message
}

export default async function MessageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sent?: string; error?: string }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  // Authentication and RBAC check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // RBAC enforcement - only MEMBER and above can view messages
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to view messages')
  }

  const message = await getMessage(resolvedParams.id, user)
  if (!message) {
    notFound()
  }

  // Mark as read if current user is recipient and message is unread
  if (message.recipientId === user.id && !message.isRead) {
    await markAsRead(message.id)
  }

  const isCurrentUserSender = message.senderId === user.id
  const otherUser = isCurrentUserSender ? message.recipient : message.sender
  const allMessages = [message, ...message.replies]

  const errorMessage = resolvedSearchParams.error === 'empty_reply' 
    ? 'Reply cannot be empty' 
    : resolvedSearchParams.error === 'reply_failed' 
    ? 'Failed to send reply. Please try again.'
    : resolvedSearchParams.error === 'rate_limited'
    ? 'Rate limit exceeded. Please wait before sending another reply.'
    : resolvedSearchParams.error === 'validation_failed'
    ? 'Invalid reply data. Please check your input.'
    : null

  const successMessage = resolvedSearchParams.sent === 'true' ? 'Message sent successfully!' : null

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Message"
        description="Message conversation"
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/messages"
            className="inline-flex items-center text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Messages
          </Link>
          
          <div className="text-sm text-ink-muted">
            Conversation with {otherUser.name || otherUser.email}
          </div>
        </div>

        {successMessage && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Message Thread */}
        <div className="space-y-4">
          {allMessages.map((msg, index) => {
            const msgSender = msg.sender
            const isMsgFromCurrentUser = msg.senderId === user.id
            const isOriginalMessage = index === 0

            return (
              <Card key={msg.id} className={`${isMsgFromCurrentUser ? 'ml-8 bg-blue-50' : 'mr-8'}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-full ${isMsgFromCurrentUser ? 'bg-blue-600' : 'bg-gray-600'}`}>
                        <User className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {isMsgFromCurrentUser ? 'You' : (msgSender.name || msgSender.email)}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!msg.isRead && !isMsgFromCurrentUser && (
                        <Circle className="h-2 w-2 fill-blue-600 text-blue-600" />
                      )}
                      {isOriginalMessage && (
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          Original
                        </span>
                      )}
                    </div>
                  </div>
                  {isOriginalMessage && msg.subject && (
                    <CardTitle className="text-lg mt-2">{msg.subject}</CardTitle>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Reply Form */}
        <ReplyForm messageId={message.id} />
      </div>
    </AppLayout>
  )
}