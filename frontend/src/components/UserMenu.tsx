import { LogoutOutlined, PictureOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Dropdown, Space, Tag, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const initials = user.username.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const items: MenuProps['items'] = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ fontWeight: 700 }}>{user.username}</div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Typography.Text>
          <div style={{ marginTop: 4 }}>
            <Tag color="blue" style={{ fontSize: 11 }}>{user.role?.name ?? 'USER'}</Tag>
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
        <Avatar size={32} style={{ background: '#1d4ed8', fontWeight: 700 }}>
          {user.avatar ? <img src={user.avatar} alt={user.username} /> : initials}
        </Avatar>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{user.username}</span>
        <UserOutlined style={{ fontSize: 12, opacity: 0.5 }} />
      </Space>
    </Dropdown>
  )
}
