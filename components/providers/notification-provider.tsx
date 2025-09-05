'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useNotifications, AppNotification } from '@/hooks/use-notifications'

interface NotificationContextType {
  notifications: AppNotification[]
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => string
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const notifications = useNotifications()

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider')
  }
  return context
}