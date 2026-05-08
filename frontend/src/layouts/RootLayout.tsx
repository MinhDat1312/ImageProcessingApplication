import { PictureOutlined } from '@ant-design/icons'
import { ConfigProvider, Layout, theme } from 'antd'
import type { ReactNode } from 'react'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'

const { Header, Content } = Layout

interface RootLayoutProps {
  children: ReactNode
  contentClassName?: string
}

export function RootLayout({ children, contentClassName }: RootLayoutProps) {
  const { themeMode, toggleTheme } = useTheme()
  const { user } = useAuth()

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1d4ed8',
          colorInfo: '#1d4ed8',
          colorSuccess: '#16a34a',
          colorError: '#dc2626',
          borderRadius: 14,
        },
      }}
    >
      <Layout className={`app-layout ${themeMode === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <Header className="app-header">
          <div className="app-title-group">
            <PictureOutlined className="app-title-icon" />
            <span className="app-title-text">Image Processing Pipeline</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user && <UserMenuSlot />}
            <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
          </div>
        </Header>
        <Content className={contentClassName}>{children}</Content>
      </Layout>
    </ConfigProvider>
  )
}

// Lazy require to avoid circular/missing-module issues before UserMenu is created in Task 11
function UserMenuSlot() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { UserMenu } = require('../components/UserMenu')
    return <UserMenu />
  } catch {
    return null
  }
}
