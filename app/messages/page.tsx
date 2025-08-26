import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/app/lib/db'
import type { Message, User } from '@prisma/client'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquare, Send, Inbox, Search, Circle } from 'lucide-react'
import Link from 'next/link'

type MessageWithSender = Message & { sender: Pick<User, 'id' | 'name' | 'email'> } & { replies: Message[] }
type MessageWithRecipient = Message & { recipient: Pick<User, 'id' | 'name' | 'email'> } & { replies: Message[] }

async function getMessages(userId: string, filter: 'inbox' | 'sent'): Promise<MessageWithSender[] | MessageWithRecipient[]> {
  if (filter === 'sent') {
    return db.message.findMany({
      where: {
        senderId: userId,
        parentMessageId: null
      },
      include: {
        recipient: {
          select: { id: true, name: true, email: true }
        },
        replies: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  } else {
    return db.message.findMany({
      where: {
        recipientId: userId,
        parentMessageId: null
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true }
        },
        replies: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
  }
}

async function getUnreadCount(userId: string) {
  return db.message.count({
    where: {
      recipientId: userId,
      isRead: false
    }
  })
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: 'inbox' | 'sent' }>
}) {
  const resolvedSearchParams = await searchParams
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const filter = resolvedSearchParams.filter || 'inbox'
  const messages = await getMessages(session.user.id, filter)
  const unreadCount = await getUnreadCount(session.user.id)

  // Get full user details for sidebar
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <AppLayout user={user}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-ink-muted">
            {unreadCount > 0 && `${unreadCount} unread • `}
            {messages.length} {filter === 'inbox' ? 'received' : 'sent'}
          </p>
        </div>
        <Link href="/messages/compose">
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Compose
          </Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="w-48">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                <Link
                  href="/messages?filter=inbox"
                  className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                    filter === 'inbox' ? 'bg-elevated text-ink' : 'text-ink-muted hover:bg-elevated/50'
                  }`}
                >
                  <span className="flex items-center">
                    <Inbox className="h-4 w-4 mr-2" />
                    Inbox
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-accent text-white text-xs rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/messages?filter=sent"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    filter === 'sent' ? 'bg-elevated text-ink' : 'text-ink-muted hover:bg-elevated/50'
                  }`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Sent
                </Link>
              </nav>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
                <Input
                  placeholder="Search messages..."
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-ink-muted" />
                  <h3 className="mt-2 text-sm font-medium text-ink">
                    No messages
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {filter === 'inbox' ? 'Your inbox is empty' : 'You haven\'t sent any messages'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => {
                    const otherUser = filter === 'inbox' 
                      ? (message as MessageWithSender).sender 
                      : (message as MessageWithRecipient).recipient
                    const hasReplies = message.replies && message.replies.length > 0
                    
                    return (
                      <Link
                        key={message.id}
                        href={`/messages/${message.id}`}
                        className="block"
                      >
                        <div className={`p-4 rounded-lg border hover:bg-elevated/50 transition-colors ${
                          !message.isRead && filter === 'inbox' ? 'bg-blue-50 border-blue-200' : ''
                        }`}>
                          <div className="flex items-start space-x-3">
                            {!message.isRead && filter === 'inbox' && (
                              <Circle className="h-2 w-2 mt-2 fill-blue-600 text-blue-600" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-medium text-ink ${
                                  !message.isRead && filter === 'inbox' ? 'font-bold' : ''
                                }`}>
                                  {otherUser.name || otherUser.email}
                                </p>
                                <p className="text-xs text-ink-muted">
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {message.subject && (
                                <p className={`text-sm text-ink mt-1 ${
                                  !message.isRead && filter === 'inbox' ? 'font-semibold' : ''
                                }`}>
                                  {message.subject}
                                </p>
                              )}
                              <p className="text-sm text-ink-muted mt-1 line-clamp-2">
                                {message.content}
                              </p>
                              {hasReplies && (
                                <p className="text-xs text-ink-muted mt-2">
                                  {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </AppLayout>
  )
}