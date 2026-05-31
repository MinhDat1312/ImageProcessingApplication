import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type NotificationKind = 'success' | 'error' | 'info' | 'warning'

export interface AppNotification {
  id: string
  title: string
  message: string
  kind: NotificationKind
  createdAt: string
  read: boolean
  duration?: number
}

interface NotificationsContextValue {
  notifications: AppNotification[]
  unreadCount: number
  markAllRead: () => void
  clearNotifications: () => void
}

const STORAGE_KEY = 'goat-image-ai-notifications'
const NOTIFICATION_SYNC_EVENT = 'goat-image-ai:notification-sync'
const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined)

export type AppNotificationInput = Omit<AppNotification, 'id' | 'createdAt' | 'read'>

function createNotificationId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readStoredNotifications() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as AppNotification[]
    }
  } catch {
    return []
  }
  return []
}

function writeStoredNotifications(notifications: AppNotification[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)))
}

function createNotification(input: AppNotificationInput): AppNotification {
  return {
    ...input,
    id: createNotificationId(),
    createdAt: new Date().toISOString(),
    read: false,
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(readStoredNotifications)

  useEffect(() => {
    writeStoredNotifications(notifications)
  }, [notifications])

  useEffect(() => {
    const handleSync = () => {
      setNotifications(readStoredNotifications())
    }

    window.addEventListener(NOTIFICATION_SYNC_EVENT, handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener(NOTIFICATION_SYNC_EVENT, handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(item => ({ ...item, read: true })))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const value = useMemo<NotificationsContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter(item => !item.read).length,
    markAllRead,
    clearNotifications,
  }), [clearNotifications, markAllRead, notifications])

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationsProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export function pushAppNotification(input: AppNotificationInput) {
  const current = readStoredNotifications()
  const latest = current[0]
  if (
    latest &&
    latest.title === input.title &&
    latest.message === input.message &&
    Date.now() - new Date(latest.createdAt).getTime() < 1500
  ) {
    window.dispatchEvent(new Event(NOTIFICATION_SYNC_EVENT))
    return
  }

  const next = [createNotification(input), ...current].slice(0, 50)
  writeStoredNotifications(next)
  window.dispatchEvent(new Event(NOTIFICATION_SYNC_EVENT))
}
