import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AppLayout } from '@/components/layout/app-layout'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser, createTenantWhereClause, hasMinRole } from '@/lib/rbac'
import { UserRole } from '@prisma/client'
import { MessageForm } from './message-form'

async function getUsers(
  user: { id: string; role: UserRole; tenantId: string | null }
) {
  // Apply tenant isolation for user selection
  const tenantWhereClause = await createTenantWhereClause(user)
  
  return prisma.user.findMany({
    where: {
      ...tenantWhereClause,
      id: { not: user.id },
      memberStatus: 'ACTIVE'
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
    take: 100 // Limit for performance
  })
}

export default async function ComposeMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; recipientId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  
  // Authentication and RBAC check
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/signin')
  }

  // RBAC enforcement - only MEMBER and above can compose messages
  if (!hasMinRole(user.role, UserRole.MEMBER)) {
    throw new Error('Insufficient permissions to compose messages')
  }

  // Get all users in the same tenant for recipient selection
  const users = await getUsers(user)

  const errorMessage = resolvedSearchParams.error === 'invalid_recipient' 
    ? 'Invalid recipient selected' 
    : resolvedSearchParams.error === 'send_failed' 
    ? 'Failed to send message. Please try again.'
    : resolvedSearchParams.error === 'rate_limited'
    ? 'Rate limit exceeded. Please wait before sending another message.'
    : resolvedSearchParams.error === 'validation_failed'
    ? 'Invalid message data. Please check your input and try again.'
    : null

  return (
    <AppLayout user={user}>
      <PageHeader
        title="Compose Message"
        description="Send a message to another member"
      />

      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <Link
            href="/messages"
            className="inline-flex items-center text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Messages
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Send className="h-5 w-5 mr-2" />
              New Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            <MessageForm 
              users={users}
              defaultRecipientId={resolvedSearchParams.recipientId}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}