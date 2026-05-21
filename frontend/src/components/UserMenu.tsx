import { DownOutlined, LogoutOutlined, PictureOutlined, DashboardOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdminRole, normalizeRoleName } from '../utils/roleUtils'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // ALL hooks FIRST — before any early returns (Rules of Hooks compliance)
  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }, [logout, navigate])

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? ''
  const normalizedRole = normalizeRoleName(user?.role?.name)

  // I2: memoize items array so it is not recreated on every render
  const items = useMemo<MenuProps['items']>(() => [
    {
      key: 'info',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
          <Avatar
            size={36}
            src={user?.avatar || undefined}
            style={{ background: '#1d4ed8', fontWeight: 700, flexShrink: 0 }}
          >
            {!user?.avatar && initials}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700 }}>{user?.username}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{user?.email}</Typography.Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue" style={{ fontSize: 11 }}>{normalizedRole}</Tag>
            </div>
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'my-images',
      icon: <PictureOutlined />,
      label: 'My Images',
      onClick: () => navigate('/my-images'),
    },
    ...(isAdminRole(user?.role?.name) ? [
      { type: 'divider' as const },
      {
        key: 'admin',
        icon: <DashboardOutlined />,
        label: 'Admin Dashboard',
        onClick: () => navigate('/admin'),
      },
    ] : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ], [user?.avatar, user?.username, user?.email, user?.role?.name, normalizedRole, initials, navigate, handleLogout])

  // Early return AFTER all hooks
  if (!user) return null

  // I3: wrap trigger in a native <button> for keyboard accessibility and screen readers
  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <button
        type="button"
        aria-label={`User menu for ${user.username}`}
        style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0, display: 'flex', alignItems: 'center' }}
      >
        <Space>
          <Avatar
            size={32}
            src={user.avatar || undefined}
            style={{ background: '#1d4ed8', fontWeight: 700 }}
          >
            {!user.avatar && initials}
          </Avatar>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</span>
          <DownOutlined style={{ fontSize: 12, opacity: 0.5 }} />
        </Space>
      </button>
    </Dropdown>
  )
}
