'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'
import { Clock, Users } from 'lucide-react'

interface ThreadCardProps {
  thread: {
    id: string
    createdAt: Date
    updatedAt: Date
    creator: {
      name: string | null
      image: string | null
    }
    participants: Array<{
      name: string | null
      image: string | null
    }>
    latestMessage: {
      body: string
      createdAt: Date
      author: {
        name: string | null
      }
    } | null
    unreadCount: number
  }
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const participantNames = thread.participants
    .filter(p => p.name)
    .map(p => p.name)
    .join(', ')

  const latestMessage = thread.latestMessage
  const hasUnread = thread.unreadCount > 0

  return (
    <Link
      href={`/messages/${thread.id}`}
      className="block"
    >
      <div className={`p-4 rounded-lg border hover:bg-elevated/50 transition-colors ${
        hasUnread ? 'bg-blue-50 border-blue-200' : 'border-border'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="flex -space-x-1">
            {thread.participants.slice(0, 2).map((participant, index) => (
              <div key={index} className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
            {thread.participants.length > 2 && (
              <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground">
                  +{thread.participants.length - 2}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium text-ink ${hasUnread ? 'font-bold' : ''}`}>
                  {participantNames || 'Conversation'}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {thread.participants.length}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5">
                    {thread.unreadCount}
                  </Badge>
                )}
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(thread.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {latestMessage && (
              <div className="mt-1">
                <p className="text-xs text-muted-foreground">
                  {latestMessage.author.name}: 
                </p>
                <p className={`text-sm text-ink-muted mt-1 line-clamp-2 ${
                  hasUnread ? 'font-semibold text-ink' : ''
                }`}>
                  {latestMessage.body}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}