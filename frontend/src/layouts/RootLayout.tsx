import { AppstoreOutlined, BellOutlined, CommentOutlined, CompassOutlined, PictureOutlined, RocketOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { ConfigProvider, Layout, theme } from 'antd'
import { Button } from '../components/ui/Button'
import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import goatLogo from '../assets/goat.png'
import '../styles/system.css'
import { ThemeToggle } from '../components/ThemeToggle'
import { UserMenu } from '../components/UserMenu'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { isAdminRole } from '../utils/roleUtils'
import AmbientBackground from '../components/AmbientBackground'

const { Header, Content } = Layout

const baseNavItems = [
  { key: '/', label: 'Home', icon: <AppstoreOutlined /> },
  { key: '/generate', label: 'AI Generator', icon: <ThunderboltOutlined /> },
  { key: '/studio', label: 'Studio', icon: <RocketOutlined /> },
  { key: '/explore', label: 'Explore', icon: <CompassOutlined /> },
  { key: '/chat', label: 'AI Chat', icon: <CommentOutlined /> },
  { key: '/my-images', label: 'Gallery', icon: <PictureOutlined /> },
  { key: '/admin', label: 'Admin', icon: <AppstoreOutlined />, adminOnly: true },
]

interface RootLayoutProps {
  children: ReactNode
  contentClassName?: string
}

export function RootLayout({ children, contentClassName }: RootLayoutProps) {
  const { themeMode, toggleTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = isAdminRole(user?.role?.name)

  const navItems = baseNavItems.filter(item => !item.adminOnly || isAdmin)

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#5E6AD2',
          colorInfo: '#5E6AD2',
          colorSuccess: '#30e3a6',
          colorError: '#ff6b7a',
          colorWarning: '#f5b942',
          borderRadius: 12,
          fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 14,
          colorBgLayout: 'transparent',
          colorBgContainer: themeMode === 'dark' ? 'rgba(10, 10, 12, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          colorBorder: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.08)',
        },
      }}
    >
      <Layout className={`app-layout ${themeMode === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <AmbientBackground />
        <div className="app-orbit app-orbit-one" />
        <div className="app-orbit app-orbit-two" />
        <div className="app-shell-grid">
          <div className="app-shell-main fullwidth">
            <Header className="app-header">
              <div className="app-header-inner">
                <div className="app-topbar-left">
                  <button type="button" className="brand-mark brand-mark-topbar" onClick={() => navigate('/studio')} aria-label="Go to studio">
                    <span className="brand-icon brand-logo-wrap">
                      <img className="brand-logo" src={goatLogo} alt="Goat logo" />
                    </span>
                    <span className="brand-copy">
                      <strong>Goat Image AI</strong>
                    </span>
                  </button>
                </div>

                <nav className="app-topbar-center topbar-nav" aria-label="Primary navigation">
                  {navItems.map(item => {
                    const active = location.pathname === item.key || (item.key !== '/' && location.pathname.startsWith(item.key))
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className={`topbar-nav-item ${active ? 'is-active' : ''}`}
                        onClick={() => navigate(item.key)}
                      >
                        <span className="topbar-nav-label">{item.label}</span>
                      </button>
                    )
                  })}
                </nav>

                <div className="app-actions">
                  <Button variant="ghost" icon={<BellOutlined style={{ fontSize: '22px' }} />} aria-label="Notifications" style={{ marginTop: 'var(--spacing-2)' }} />
                  {user ? <UserMenu /> : <Button variant="primary" onClick={() => navigate('/login')}>Sign In</Button>}
                  <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
                </div>
              </div>
            </Header>

            <Content className={contentClassName ? `app-content ${contentClassName}` : 'app-content'}>{children}</Content>

            <nav className="app-mobile-nav" aria-label="Mobile navigation">
              {navItems.map(item => {
                const active = location.pathname === item.key || (item.key !== '/' && location.pathname.startsWith(item.key))
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`mobile-nav-item ${active ? 'is-active' : ''}`}
                    onClick={() => navigate(item.key)}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="mobile-nav-icon">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                )
              })}
              <button type="button" className="mobile-nav-item" onClick={() => navigate('/login')}>
                <span className="mobile-nav-icon"><SettingOutlined /></span>
                <span>Account</span>
              </button>
            </nav>
          </div>
        </div>
      </Layout>
    </ConfigProvider>
  )
}
