import { ConfigProvider, Layout, theme } from 'antd'
import { type ReactNode } from 'react'
import { useTheme } from '../hooks/useTheme'

const { Content } = Layout

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { themeMode, toggleTheme } = useTheme()

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
        <Content style={{ padding: '20px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </Content>
      </Layout>
    </ConfigProvider>
  )
}
