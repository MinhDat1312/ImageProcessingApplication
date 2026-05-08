import { DownOutlined, LogoutOutlined, PictureOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const initials = user.username.slice(0, 2).toUpperCase()
  const normalizedRole = (user.role?.name ?? 'USER').replace(/^ROLE_/i, '')

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const items: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
          <Avatar
            size={36}
            src={user.avatar || undefined}
            style={{ background: '#1d4ed8', fontWeight: 700, flexShrink: 0 }}
          >
            {!user.avatar && initials}
          </Avatar>
          <div>
            <div style={{ fontWeight: 700 }}>{user.username}</div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Typography.Text>
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
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Space style={{ cursor: 'pointer' }}>
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
    </Dropdown>
  )
}
