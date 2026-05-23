import { ConfigProvider, Layout, Tag, theme } from 'antd'
import { Button } from '../components/ui/Button'
import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import goatLogo from '../assets/goat.png'
import { useTheme } from '../hooks/useTheme'
import { PictureOutlined, RocketOutlined, ThunderboltOutlined } from '@ant-design/icons'

const { Content } = Layout

interface AuthLayoutProps {
  children: ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { themeMode, toggleTheme } = useTheme()
  const navigate = useNavigate()

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
      <Layout className={`app-layout auth-layout ${themeMode === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <div className="app-orbit app-orbit-one" />
        <div className="app-orbit app-orbit-two" />
        <Content className="auth-layout-content">
          <aside className="auth-marketing-panel">
            <button type="button" className="brand-mark auth-brand" onClick={() => navigate('/')} aria-label="Go to studio home">
              <span className="brand-icon brand-logo-wrap">
                <img className="brand-logo" src={goatLogo} alt="Goat logo" />
              </span>
              <span className="brand-copy">
                <strong>Goat Image AI</strong>
                <span>Secure AI image platform</span>
              </span>
            </button>

            <div className="auth-marketing-card glass-card">
              <Tag color="magenta">Midjourney-inspired</Tag>
              <h1>Launch a premium AI image studio with elegant workflow design.</h1>
              <p>
                Upload, transform, generate, and publish visual assets in a realtime workspace built for teams and creators.
              </p>

              <div className="auth-feature-list">
                <div><ThunderboltOutlined /> Gemini prompt assistance</div>
                <div><RocketOutlined /> Fast pipeline orchestration</div>
                <div><PictureOutlined /> S3 / MinIO image storage</div>
              </div>
            </div>

            <div className="auth-mini-stats">
              <div>
                <strong>Realtime</strong>
                <span>WebSocket feedback</span>
              </div>
              <div>
                <strong>Responsive</strong>
                <span>Mobile to desktop</span>
              </div>
              <div>
                <strong>Accessible</strong>
                <span>Keyboard & screen-reader friendly</span>
              </div>
            </div>
          </aside>

          <div className="auth-form-panel">
            <div className="auth-theme-toggle">
              <Button variant="ghost" onClick={toggleTheme} size="small">
                {themeMode === 'dark' ? 'Light mode' : 'Dark mode'}
              </Button>
            </div>
            {children}
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  )
}
