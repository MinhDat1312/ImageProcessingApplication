import { BellOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Badge, Empty, Tag } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useNotifications, type AppNotification } from '../context/NotificationsContext'

function timeAgo(dateStr: string) {
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return date.toLocaleDateString()
}

function kindIcon(item: AppNotification) {
  if (item.kind === 'success') return <CheckCircleOutlined className="notification-kind-success" />
  if (item.kind === 'error') return <CloseCircleOutlined className="notification-kind-error" />
  return <InfoCircleOutlined className="notification-kind-info" />
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, clearNotifications } = useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const handleToggle = () => {
    setOpen(current => {
      const nextOpen = !current
      if (nextOpen) {
        markAllRead()
      }
      return nextOpen
    })
  }

  const content = (
    <div className="notification-panel" role="dialog" aria-label="Notifications">
      <div className="notification-panel-header">
        <div>
          <strong>Notifications</strong>
          <span>{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</span>
        </div>
        <div className="notification-panel-actions">
          <button type="button" onClick={markAllRead}>Mark read</button>
          <button type="button" onClick={clearNotifications}>Clear</button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications yet" />
      ) : (
        <div className="notification-list">
          {notifications.map(item => (
            <article key={item.id} className={`notification-item ${item.read ? '' : 'is-unread'}`}>
              <div className="notification-item-icon">{kindIcon(item)}</div>
              <div className="notification-item-body">
                <div className="notification-item-title">
                  <strong>{item.title}</strong>
                  {!item.read && <Tag color="blue">New</Tag>}
                </div>
                <p>{item.message}</p>
                <span>{timeAgo(item.createdAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="notification-root" ref={rootRef}>
      <span className="notification-trigger">
        <Badge count={unreadCount} size="small" offset={[-4, 7]}>
          <button
            type="button"
            className="notification-trigger-button"
            aria-label="Notifications"
            aria-expanded={open}
            onClick={handleToggle}
          >
            <BellOutlined style={{ fontSize: '22px' }} />
          </button>
        </Badge>
      </span>
      {open && (
        <div className="notification-floating-panel">
          {content}
        </div>
      )}
    </div>
  )
}
