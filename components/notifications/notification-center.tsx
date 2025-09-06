'use client'

import { useState } from 'react'
import { Bell, Settings, MessageSquare, Megaphone, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface NotificationCenterProps {
  notifications: {
    summary: {
      unreadAnnouncements: number
      unreadMessages: number
      total: number
    }
    recentActivity: Array<{
      id: string
      type: 'announcement' | 'message'
      title: string
      content: string
      author: string | null
      createdAt: Date
      isRead: boolean
      threadId?: string
    }>
  }
}

export function NotificationCenter({ notifications }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { summary, recentActivity } = notifications

  const announcements = recentActivity.filter(item => item.type === 'announcement')
  const messages = recentActivity.filter(item => item.type === 'message')

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {summary.total > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {summary.total > 99 ? '99+' : summary.total}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <Link href="/notifications/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {summary.total === 0 ? (
              <div className="text-center py-6">
                <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No new notifications
                </p>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">
                    All ({summary.total})
                  </TabsTrigger>
                  <TabsTrigger value="announcements" className="text-xs">
                    <Megaphone className="h-3 w-3 mr-1" />
                    {summary.unreadAnnouncements}
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    {summary.unreadMessages}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No recent activity
                      </p>
                    ) : (
                      recentActivity.map((item) => (
                        <NotificationItem key={item.id} item={item} onClose={() => setIsOpen(false)} />
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="announcements" className="mt-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {announcements.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No announcement notifications
                      </p>
                    ) : (
                      announcements.map((item) => (
                        <NotificationItem key={item.id} item={item} onClose={() => setIsOpen(false)} />
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="messages" className="mt-4">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No message notifications
                      </p>
                    ) : (
                      messages.map((item) => (
                        <NotificationItem key={item.id} item={item} onClose={() => setIsOpen(false)} />
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

interface NotificationItemProps {
  item: {
    id: string
    type: 'announcement' | 'message'
    title: string
    content: string
    author: string | null
    createdAt: Date
    isRead: boolean
    threadId?: string
  }
  onClose: () => void
}

function NotificationItem({ item, onClose }: NotificationItemProps) {
  const href = item.type === 'announcement' 
    ? '/announcements'
    : item.threadId 
    ? `/messages/${item.threadId}`
    : '/messages'

  const Icon = item.type === 'announcement' ? Megaphone : MessageSquare

  return (
    <Link 
      href={href}
      onClick={onClose}
      className={`block p-3 rounded-lg border transition-colors hover:bg-muted/50 ${
        !item.isRead ? 'bg-blue-50 border-blue-200' : 'border-border'
      }`}
    >
      <div className="flex items-start space-x-2">
        <Icon className={`h-4 w-4 mt-0.5 ${
          item.type === 'announcement' ? 'text-orange-500' : 'text-blue-500'
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${!item.isRead ? 'font-bold' : ''}`}>
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {item.content}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              By {item.author}
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}