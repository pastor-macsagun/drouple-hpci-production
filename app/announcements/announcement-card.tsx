'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, AlertCircle, Info, AlertTriangle, Clock, Check, Eye } from 'lucide-react'
import { AnnouncementPriority } from '@prisma/client'
import { markAnnouncementAsRead } from '@/app/admin/announcements/actions'

const priorityIcons = {
  [AnnouncementPriority.LOW]: Info,
  [AnnouncementPriority.NORMAL]: Bell,
  [AnnouncementPriority.HIGH]: AlertTriangle,
  [AnnouncementPriority.URGENT]: AlertCircle,
}

const priorityColors = {
  [AnnouncementPriority.LOW]: 'text-blue-600 bg-blue-50',
  [AnnouncementPriority.NORMAL]: 'text-gray-600 bg-gray-50',
  [AnnouncementPriority.HIGH]: 'text-orange-600 bg-orange-50',
  [AnnouncementPriority.URGENT]: 'text-red-600 bg-red-50',
}

interface AnnouncementCardProps {
  announcement: {
    id: string
    title: string
    content: string
    priority: AnnouncementPriority
    scope: string
    publishedAt: Date | null
    createdAt: Date
    expiresAt: Date | null
    isRead: boolean
    readAt: Date | null
    author: {
      name: string | null
      role: string
    }
    localChurch: {
      name: string
    }
  }
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [isRead, setIsRead] = useState(announcement.isRead)
  const [isPending, startTransition] = useTransition()
  
  const Icon = priorityIcons[announcement.priority]
  const colorClass = priorityColors[announcement.priority]

  const handleMarkAsRead = () => {
    if (isRead) return
    
    startTransition(async () => {
      const result = await markAnnouncementAsRead(announcement.id)
      if (result.success) {
        setIsRead(true)
      }
    })
  }

  return (
    <Card 
      key={announcement.id} 
      className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
        !isRead ? 'ring-2 ring-blue-200 bg-blue-50/50' : ''
      }`}
      onClick={handleMarkAsRead}
    >
      <div className={`h-1 ${
        announcement.priority === AnnouncementPriority.URGENT ? 'bg-red-500' : 
        announcement.priority === AnnouncementPriority.HIGH ? 'bg-orange-500' : 
        'bg-gray-300'
      }`} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className={`text-xl flex items-center gap-2 ${
                !isRead ? 'font-bold' : ''
              }`}>
                {announcement.title}
                {!isRead && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    NEW
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-4 mt-1 text-sm text-ink-muted">
                <span>By {announcement.author.name}</span>
                <span>•</span>
                <span>{announcement.localChurch.name}</span>
                <span>•</span>
                <span>{new Date(announcement.publishedAt || announcement.createdAt).toLocaleDateString()}</span>
                {isRead && announcement.readAt && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="h-3 w-3" />
                      Read
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={colorClass}>
              {announcement.priority}
            </Badge>
            <Badge variant="outline">
              {announcement.scope}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap">{announcement.content}</p>
        </div>
        
        {announcement.expiresAt && (
          <div className="mt-4 flex items-center text-sm text-ink-muted">
            <Clock className="h-4 w-4 mr-1" />
            Expires {new Date(announcement.expiresAt).toLocaleDateString()}
          </div>
        )}
        
        {!isRead && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                handleMarkAsRead()
              }}
              disabled={isPending}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {isPending ? 'Marking as read...' : 'Mark as read'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}