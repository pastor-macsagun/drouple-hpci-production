import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Search, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser, hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { getMessageThreads } from './thread-actions'
import { ThreadCard } from './thread-card'


export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const resolvedSearchParams = await searchParams
  
  // Authentication and RBAC check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // RBAC enforcement - only MEMBER and above can access messages
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to access messages')
  }

  // Get message threads using new server action
  const result = await getMessageThreads()
  const threads = result.success ? result.data : []
  const unreadCount = threads.reduce((sum, thread) => sum + thread.unreadCount, 0)
  
  const errorMessage = resolvedSearchParams.error === 'rate_limited'
    ? 'Rate limit exceeded. Please wait before sending another message.'
    : resolvedSearchParams.error === 'validation_failed'
    ? 'Invalid message data. Please check your input.'
    : null

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Messages"
        description={`${threads.length} conversation${threads.length !== 1 ? 's' : ''}${unreadCount > 0 ? ` • ${unreadCount} unread` : ''}`}
      >
        <Link href="/messages/new">
          <Button>
            <Send className="h-4 w-4 mr-2" />
            New Thread
          </Button>
        </Link>
      </PageHeader>
      
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {threads.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-ink-muted" />
              <h3 className="mt-2 text-sm font-medium text-ink">
                No conversations
              </h3>
              <p className="mt-1 text-sm text-ink-muted">
                Start a new conversation to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <ThreadCard key={thread.id} thread={thread} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  )
}