import { AppstoreOutlined, BellOutlined, CommentOutlined, CompassOutlined, PictureOutlined, RocketOutlined, SafetyOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button, ConfigProvider, Layout, Tag, theme } from 'antd'
import { type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import goatLogo from '../assets/goat.png'
import { ThemeToggle } from '../components/ThemeToggle'
import { UserMenu } from '../components/UserMenu'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import { isAdminRole } from '../utils/roleUtils'

const { Header, Content } = Layout

const baseNavItems = [
  { key: '/', label: 'Home', icon: <AppstoreOutlined /> },
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
          colorPrimary: '#39d6ff',
          colorInfo: '#8b7dff',
          colorSuccess: '#30e3a6',
          colorError: '#ff6b7a',
          colorWarning: '#f5b942',
          borderRadius: 18,
          fontFamily: 'Manrope, sans-serif',
          fontSize: 14,
          colorBgLayout: 'transparent',
          colorBgContainer: 'rgba(9, 14, 31, 0.72)',
          colorBorder: 'rgba(255, 255, 255, 0.09)',
        },
      }}
    >
      <Layout className={`app-layout ${themeMode === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <div className="app-orbit app-orbit-one" />
        <div className="app-orbit app-orbit-two" />
        <div className="app-shell-grid">
          <aside className="app-sidebar" aria-label="Primary navigation">
            <button type="button" className="brand-mark brand-mark-sidebar" onClick={() => navigate('/studio')} aria-label="Go to studio">
              <span className="brand-icon brand-logo-wrap">
                <img className="brand-logo" src={goatLogo} alt="NovaCanvas logo" />
              </span>
              <span className="brand-copy">
                <strong>NovaCanvas AI</strong>
                <span>Futuristic image studio</span>
              </span>
            </button>

            <div className="sidebar-section">
              <span className="sidebar-label">Workspace</span>
              <div className="sidebar-nav">
                {navItems.map(item => {
                  const active = location.pathname === item.key || (item.key !== '/' && location.pathname.startsWith(item.key))
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`sidebar-link ${active ? 'is-active' : ''}`}
                      onClick={() => navigate(item.key)}
                    >
                      <span className="sidebar-link-icon">{item.icon}</span>
                      <span className="sidebar-link-text">
                        <strong>{item.label}</strong>
                        <span>{item.key === '/studio' ? 'Processing studio' : item.key === '/' ? 'Explore feed' : item.label === 'Gallery' ? 'Your exports' : 'Platform tools'}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="sidebar-section sidebar-section-stats">
              <span className="sidebar-label">System</span>
              <div className="sidebar-stat-card">
                <Tag color="success" className="sidebar-stat-tag"><ThunderboltOutlined /> Realtime ready</Tag>
                <p>Glassmorphism workspace, prompt studio, and responsive command center.</p>
              </div>
            </div>
          </aside>

          <div className="app-shell-main">
            <Header className="app-header">
              <div className="app-topbar-left">
                <div className="topbar-page-title">
                  <span className="section-kicker">AI Dashboard</span>
                  <strong>Visual workspace</strong>
                </div>
                <Tag color="processing" className="nav-status"><SafetyOutlined /> Secure workspace</Tag>
              </div>

              <div className="app-topbar-center">
                <Tag color="cyan" className="topbar-chip">Dark mode futuristic</Tag>
                <Tag color="purple" className="topbar-chip">Glass UI</Tag>
                <Tag color="geekblue" className="topbar-chip">Framer Motion</Tag>
              </div>

              <div className="app-actions">
                <Button type="text" icon={<BellOutlined />} aria-label="Notifications" />
                {user ? <UserMenu /> : <Button type="primary" onClick={() => navigate('/login')}>Đăng nhập</Button>}
                <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
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
