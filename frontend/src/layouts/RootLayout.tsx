import { AppstoreOutlined, PictureOutlined, RocketOutlined, SafetyOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Layout, Tag, theme } from 'antd'
import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import goatLogo from '../assets/goat.png'
import { ThemeToggle } from '../components/ThemeToggle'
import { UserMenu } from '../components/UserMenu'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { isAdminRole } from '../utils/roleUtils'

const { Header, Content } = Layout

interface RootLayoutProps {
  children: ReactNode
  contentClassName?: string
}

export function RootLayout({ children, contentClassName }: RootLayoutProps) {
  const { themeMode, toggleTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = isAdminRole(user?.role?.name)

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#7c3aed',
          colorInfo: '#22d3ee',
          colorSuccess: '#14b8a6',
          colorError: '#f43f5e',
          borderRadius: 18,
          fontFamily: 'Manrope, sans-serif',
        },
      }}
    >
      <Layout className={`app-layout ${themeMode === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <div className="app-orbit app-orbit-one" />
        <div className="app-orbit app-orbit-two" />
        <Header className="app-header">
          <button type="button" className="brand-mark" onClick={() => navigate('/')} aria-label="Go to studio home">
            <span className="brand-icon brand-logo-wrap">
              <img className="brand-logo" src={goatLogo} alt="Goat logo" />
            </span>
            <span className="brand-copy">
              <strong>NovaCanvas AI</strong>
              <span>Image Processing & Generation Studio</span>
            </span>
          </button>

          <div className="app-nav">
            <Button type="text" icon={<RocketOutlined />} onClick={() => navigate('/')}>Studio</Button>
            <Button type="text" icon={<PictureOutlined />} onClick={() => navigate('/my-images')}>Gallery</Button>
            {isAdmin && <Button type="text" icon={<AppstoreOutlined />} onClick={() => navigate('/admin')}>Admin</Button>}
            <Tag color="processing" className="nav-status"><SafetyOutlined /> Secure workspace</Tag>
          </div>

          <div className="app-actions">
            {user ? <UserMenu /> : <Button type="primary" onClick={() => navigate('/login')}>Đăng nhập</Button>}
            <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
          </div>
        </Header>
        <Content className={contentClassName ? `app-content ${contentClassName}` : 'app-content'}>{children}</Content>
      </Layout>
    </ConfigProvider>
  )
}
