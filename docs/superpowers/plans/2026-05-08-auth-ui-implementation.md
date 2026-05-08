# Auth UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thêm Auth UI (Login, Register, Verify) + post-login user section (header dropdown + My Images gallery) vào FE hiện tại, integrate hoàn toàn với BE auth APIs qua HttpOnly cookies.

**Architecture:** React Context (AuthContext) quản lý auth state; Axios instance dùng chung với `withCredentials: true` và response interceptor tự refresh token khi 401; react-router-dom v6 cho routing với ProtectedRoute guard; RootLayout cung cấp ConfigProvider + Header chung cho tất cả pages.

**Tech Stack:** React 19, TypeScript, Vite, Ant Design 6, react-router-dom v6, Axios, Framer Motion, Vitest + @testing-library/react

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/types/index.ts` | Modify | Thêm `LoginResponse`, `UserResponse`, `ImageItem` |
| `frontend/src/api/axiosInstance.ts` | Create | Axios instance, baseURL, withCredentials, silent refresh interceptor |
| `frontend/src/context/AuthContext.tsx` | Create | Auth state, login/logout, session check on mount |
| `frontend/src/components/ProtectedRoute.tsx` | Create | Guard route, redirect /login nếu chưa auth |
| `frontend/src/layouts/RootLayout.tsx` | Create | ConfigProvider + Layout + Header chung (logo, UserMenu, ThemeToggle) |
| `frontend/src/App.tsx` | Modify | Xóa ConfigProvider/Layout/Header/useTheme, giữ pipeline content, dùng axiosInstance |
| `frontend/src/main.tsx` | Modify | Thêm BrowserRouter + AuthProvider + Routes |
| `frontend/src/App.css` | Modify | Thêm auth page styles |
| `frontend/src/pages/LoginPage.tsx` | Create | Form đăng nhập, validation, server errors |
| `frontend/src/pages/RegisterPage.tsx` | Create | Form đăng ký, password rules checklist |
| `frontend/src/pages/VerifyPage.tsx` | Create | 6-ô OTP, countdown, resend cooldown |
| `frontend/src/components/UserMenu.tsx` | Create | Avatar dropdown: My Images + Logout |
| `frontend/src/pages/MyImagesPage.tsx` | Create | Gallery 3-col, pagination, empty state |
| `frontend/src/__tests__/AuthContext.test.tsx` | Create | Test session check, login, logout |
| `frontend/src/__tests__/ProtectedRoute.test.tsx` | Create | Test redirect behavior |

---

## Task 1: Install react-router-dom + Add Types

**Files:**
- Run: `frontend/` (npm install)
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Install react-router-dom**

```bash
cd frontend
npm install react-router-dom
```

Expected output: `added N packages` — no errors.

- [ ] **Step 2: Add auth + image types to `src/types/index.ts`**

Append to the end of the existing file (keep all existing exports):

```ts
export interface LoginResponse {
  userId: string
  username: string
  email: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  avatar: string
  enabled: boolean
  role: { roleId: string; name: string }
}

export interface UserResponse extends LoginResponse {
  createdAt: string
  updatedAt: string
}

export interface ImageItem {
  id: string
  url: string
  createdAt: string
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/index.ts frontend/package.json frontend/package-lock.json
git commit -m "feat: install react-router-dom and add auth types"
```

---

## Task 2: Create axiosInstance

**Files:**
- Create: `frontend/src/api/axiosInstance.ts`

- [ ] **Step 1: Create `src/api/axiosInstance.ts`**

```ts
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
})

export default axiosInstance
```

Note: silent refresh interceptor sẽ được thêm ở Task 14 sau khi AuthContext đã có.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/api/axiosInstance.ts
git commit -m "feat: add shared axiosInstance with withCredentials"
```

---

## Task 3: Create AuthContext + Tests

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/__tests__/AuthContext.test.tsx`

- [ ] **Step 1: Write failing tests first**

Create `frontend/src/__tests__/AuthContext.test.tsx`:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'
import axiosInstance from '../api/axiosInstance'
import type { LoginResponse } from '../types'

vi.mock('../api/axiosInstance')
const mockedAxios = vi.mocked(axiosInstance, true)

const fakeUser: LoginResponse = {
  userId: 'u1',
  username: 'ThinhVinh',
  email: 'thinh@test.com',
  gender: 'MALE',
  avatar: '',
  enabled: true,
  role: { roleId: 'r1', name: 'USER' },
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

beforeEach(() => vi.clearAllMocks())

describe('AuthContext', () => {
  it('sets user when /users succeeds on mount', async () => {
    mockedAxios.get = vi.fn().mockResolvedValueOnce({ data: fakeUser })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toEqual(fakeUser)
  })

  it('sets user=null when both /users and /refresh fail on mount', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('401'))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('login() sets the user', async () => {
    mockedAxios.get = vi.fn().mockRejectedValue(new Error('401'))

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    result.current.login(fakeUser)
    await waitFor(() => expect(result.current.user).toEqual(fakeUser))
  })

  it('logout() clears user and calls /logout', async () => {
    mockedAxios.get = vi.fn().mockResolvedValueOnce({ data: fakeUser })
    mockedAxios.post = vi.fn().mockResolvedValueOnce({})

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual(fakeUser))

    await result.current.logout()
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/auth/logout')
    expect(result.current.user).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL (AuthContext not yet created)**

```bash
npm run test
```

Expected: FAIL — `Cannot find module '../context/AuthContext'`

- [ ] **Step 3: Create `src/context/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import axiosInstance from '../api/axiosInstance'
import type { LoginResponse } from '../types'

interface AuthContextValue {
  user: LoginResponse | null
  isLoading: boolean
  login: (user: LoginResponse) => void
  logout: () => Promise<void>
  setUser: (user: LoginResponse | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LoginResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axiosInstance.get<LoginResponse>('/api/v1/auth/users')
        setUser(res.data)
      } catch {
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  // Listen for forced logout from the silent-refresh interceptor (Task 14)
  useEffect(() => {
    const handleForceLogout = () => setUser(null)
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  const login = (userData: LoginResponse) => setUser(userData)

  const logout = async () => {
    try {
      await axiosInstance.post('/api/v1/auth/logout')
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test
```

Expected: all 4 AuthContext tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/context/AuthContext.tsx frontend/src/__tests__/AuthContext.test.tsx
git commit -m "feat: add AuthContext with session check, login, and logout"
```

---

## Task 4: Create ProtectedRoute + Test

**Files:**
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/__tests__/ProtectedRoute.test.tsx`

- [ ] **Step 1: Write failing test**

Create `frontend/src/__tests__/ProtectedRoute.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'
import * as AuthContextModule from '../context/AuthContext'
import type { LoginResponse } from '../types'

const fakeUser: LoginResponse = {
  userId: 'u1', username: 'ThinhVinh', email: 'thinh@test.com',
  gender: 'MALE', avatar: '', enabled: true,
  role: { roleId: 'r1', name: 'USER' },
}

function renderWithRouter(user: LoginResponse | null, isLoading = false) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user, isLoading,
    login: vi.fn(), logout: vi.fn(), setUser: vi.fn(),
  })

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated', async () => {
    renderWithRouter(fakeUser)
    await waitFor(() => expect(screen.getByText('Protected Content')).toBeInTheDocument())
  })

  it('redirects to /login when user is null and not loading', async () => {
    renderWithRouter(null, false)
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument())
  })

  it('shows spinner while loading', () => {
    renderWithRouter(null, true)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test
```

Expected: FAIL — `Cannot find module '../components/ProtectedRoute'`

- [ ] **Step 3: Create `src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test
```

Expected: all ProtectedRoute tests PASS, all previous tests still PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ProtectedRoute.tsx frontend/src/__tests__/ProtectedRoute.test.tsx
git commit -m "feat: add ProtectedRoute component"
```

---

## Task 5: Create RootLayout

**Files:**
- Create: `frontend/src/layouts/RootLayout.tsx`

RootLayout cung cấp `ConfigProvider` + `Layout` + `Header` cho mọi page. Header ẩn `UserMenu` khi `user === null` (tức là trên auth pages).

- [ ] **Step 1: Create `src/layouts/RootLayout.tsx`**

```tsx
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

// Lazy import để tránh circular — UserMenu được tạo ở Task 12
function UserMenuSlot() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { UserMenu } = require('../components/UserMenu')
  return <UserMenu />
}
```

Note: `UserMenuSlot` dùng `require` để tránh lỗi khi UserMenu chưa tồn tại trong quá trình build incremental. Sau khi Task 12 tạo UserMenu, thay bằng import thẳng.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (UserMenu chưa có thì có thể có warning, bỏ qua ở bước này).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/layouts/RootLayout.tsx
git commit -m "feat: add RootLayout with ConfigProvider, Header, and conditional UserMenu"
```

---

## Task 6: Refactor App.tsx + Add Auth CSS

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/App.css`

App.tsx hiện có `ConfigProvider + Layout + Header`. Sau refactor, App chỉ render phần content (pipeline UI) vì RootLayout đã xử lý phần còn lại.

- [ ] **Step 1: Rewrite `src/App.tsx`**

Thay toàn bộ nội dung App.tsx bằng:

```tsx
import { Card, Form, notification } from 'antd'
import { AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import './App.css'
import { ImagePreview } from './components/ImagePreview'
import { PipelineControls } from './components/PipelineControls'
import { ProgressPipeline } from './components/ProgressPipeline'
import { UploadZone } from './components/UploadZone'
import { usePipelineSteps } from './hooks/usePipelineSteps'
import type { ProcessFormValues, ProcessResponse } from './types'
import axiosInstance from './api/axiosInstance'

interface ApiError {
  response?: { data?: { error?: string } }
  message?: string
}

export default function App() {
  const { steps, isRunning, startSimulation, completeAll, failCurrent, reset } = usePipelineSteps()

  const [form] = Form.useForm<ProcessFormValues>()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedUrl, setProcessedUrl] = useState<string | null>(null)
  const [processedFilename, setProcessedFilename] = useState<string>()
  const [processing, setProcessing] = useState(false)
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [previewUrl])

  const handleUploadChange = (nextFile: File | null, nextPreviewUrl: string | null) => {
    setPreviewUrl(prev => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return nextPreviewUrl
    })
    setFile(nextFile)
    setProcessedUrl(null)
    setProcessedFilename(undefined)
    setExecutionTime(null)
    form.resetFields(['resizeWidth', 'resizeHeight', 'watermarkText'])
  }

  const onFinish = async (values: ProcessFormValues) => {
    if (!file) {
      notification.warning({ message: 'Please select an image before processing' })
      return
    }

    setProcessing(true)
    setProcessedUrl(null)
    startSimulation(values)

    const formData = new FormData()
    formData.append('file', file)
    if (values.resizeWidth) formData.append('resizeWidth', String(values.resizeWidth))
    if (values.resizeHeight) formData.append('resizeHeight', String(values.resizeHeight))
    if (values.filterType && values.filterType !== 'none') {
      formData.append('filterType', values.filterType)
      if (values.brightnessLevel) formData.append('brightnessLevel', String(values.brightnessLevel))
    }
    if (values.watermarkText) {
      formData.append('watermarkText', values.watermarkText)
      formData.append('watermarkPosition', values.watermarkPosition || 'bottom-right')
      formData.append('watermarkSize', String(values.watermarkSize))
    }
    formData.append('compressionQuality', String(values.compressionQuality))

    try {
      const response = await axiosInstance.post<ProcessResponse>('/api/images/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      completeAll()
      setProcessedUrl(response.data.url)
      setProcessedFilename(response.data.filename)
      setExecutionTime(response.data.executionTimeMs)
      notification.success({
        message: 'Image processed successfully',
        description: `Pipeline completed in ${response.data.executionTimeMs} ms`,
        duration: 3,
      })
    } catch (err: unknown) {
      failCurrent()
      const error = err as ApiError
      notification.error({
        message: 'Processing failed',
        description: error.response?.data?.error ?? error.message ?? 'An unexpected error occurred',
        duration: 5,
      })
    } finally {
      setProcessing(false)
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
      resetTimerRef.current = setTimeout(() => reset(), 2500)
    }
  }

  const showProgress = isRunning || steps.length > 0

  return (
    <div className="app-content">
      <div className="app-shell">
        <Card bordered={false} className="upload-hero-card" styles={{ body: { padding: 20 } }}>
          <UploadZone file={file} previewUrl={previewUrl} onChange={handleUploadChange} />
        </Card>

        <div className="workspace-grid">
          <Card bordered={false} className="settings-card" styles={{ body: { padding: 20 } }}>
            <div className="settings-header">
              <h2>Pipeline Settings</h2>
              <p>Adjust each stage, then run processing.</p>
            </div>
            <AnimatePresence mode="wait">
              {showProgress ? (
                <ProgressPipeline key="progress" steps={steps} />
              ) : (
                <PipelineControls key="controls" form={form} onFinish={onFinish} processing={processing} />
              )}
            </AnimatePresence>
          </Card>

          <Card bordered={false} className="preview-card" styles={{ body: { padding: 20 } }}>
            <ImagePreview
              originalUrl={previewUrl}
              processedUrl={processedUrl}
              executionTime={executionTime}
              processedFilename={processedFilename}
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add auth styles to `src/App.css`**

Append at the end of `App.css`:

```css
/* ── Auth pages ── */
.auth-page {
  min-height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: var(--canvas);
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: 14px;
  padding: 28px 24px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
}

.auth-card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.auth-card-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.auth-footer {
  text-align: center;
  margin-top: 14px;
  font-size: 0.83rem;
  color: var(--text-secondary);
}

.pw-rules {
  background: var(--surface-alt);
  border: 1px solid var(--border-soft);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 10px;
}

.pw-rule {
  font-size: 0.78rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.8;
  transition: color 0.15s ease;
}

.pw-rule.ok { color: #16a34a; }
.pw-rule.fail { color: #dc2626; }

.auth-server-error {
  margin-bottom: 14px;
  border-radius: 8px;
}

.otp-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 4px;
}

.otp-email {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1d4ed8;
  text-align: center;
  margin-bottom: 16px;
}

.otp-expire {
  font-size: 0.78rem;
  color: var(--text-secondary);
  text-align: center;
  margin: 8px 0;
}

.otp-expire span {
  color: #f59e0b;
  font-weight: 600;
}

.resend-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

/* ── My Images page ── */
.my-images-page {
  padding: 28px 40px 36px;
}

.my-images-shell {
  max-width: 1360px;
  margin: 0 auto;
}

.my-images-header {
  margin-bottom: 20px;
}

.my-images-header h1 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px;
}

.my-images-header p {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin: 0;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.image-grid-item {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-soft);
  background: var(--surface);
  aspect-ratio: 1;
  position: relative;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.image-grid-item:hover {
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.15);
  transform: translateY(-2px);
}

.image-grid-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-grid-item-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  padding: 6px 8px;
  font-size: 0.72rem;
  color: #fff;
}

.images-pagination {
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .images-grid { grid-template-columns: repeat(2, 1fr); }
  .my-images-page { padding: 20px 16px; }
}

@media (max-width: 480px) {
  .images-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Run all tests**

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.css
git commit -m "refactor: remove Layout/Header from App.tsx, delegate to RootLayout; use axiosInstance"
```

---

## Task 7: Update main.tsx with BrowserRouter + Routes

**Files:**
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Rewrite `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { ProtectedRoute } from './components/ProtectedRoute.tsx'
import { RootLayout } from './layouts/RootLayout.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { VerifyPage } from './pages/VerifyPage.tsx'
import { MyImagesPage } from './pages/MyImagesPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<RootLayout><LoginPage /></RootLayout>} />
          <Route path="/register" element={<RootLayout><RegisterPage /></RootLayout>} />
          <Route path="/verify" element={<RootLayout><VerifyPage /></RootLayout>} />
          <Route
            path="/"
            element={
              <RootLayout contentClassName="app-content">
                <ProtectedRoute><App /></ProtectedRoute>
              </RootLayout>
            }
          />
          <Route
            path="/my-images"
            element={
              <RootLayout contentClassName="my-images-page">
                <ProtectedRoute><MyImagesPage /></ProtectedRoute>
              </RootLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

Note: `LoginPage`, `RegisterPage`, `VerifyPage`, `MyImagesPage` chưa tồn tại → app sẽ fail build cho đến Task 9-13. Tạm thời có thể tạo placeholder stubs trong bước tiếp theo.

- [ ] **Step 2: Create temporary page stubs để app build được**

```bash
mkdir -p frontend/src/pages
```

Tạo `frontend/src/pages/LoginPage.tsx`:
```tsx
export function LoginPage() { return <div className="auth-page"><div className="auth-card">Login</div></div> }
```

Tạo `frontend/src/pages/RegisterPage.tsx`:
```tsx
export function RegisterPage() { return <div className="auth-page"><div className="auth-card">Register</div></div> }
```

Tạo `frontend/src/pages/VerifyPage.tsx`:
```tsx
export function VerifyPage() { return <div className="auth-page"><div className="auth-card">Verify</div></div> }
```

Tạo `frontend/src/pages/MyImagesPage.tsx`:
```tsx
export function MyImagesPage() { return <div>My Images</div> }
```

- [ ] **Step 3: Verify app starts**

```bash
npm run dev
```

Mở `http://localhost:5173` — nếu chưa login sẽ redirect → `/login` và hiện "Login". Không có console errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.tsx frontend/src/pages/
git commit -m "feat: wire up BrowserRouter, AuthProvider, and route structure"
```

---

## Task 8: Build LoginPage

**Files:**
- Modify: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Implement `src/pages/LoginPage.tsx`**

```tsx
import { Alert, Button, Form, Input } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import type { LoginResponse } from '../types'

interface LoginFields {
  email: string
  password: string
}

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const onFinish = async (values: LoginFields) => {
    setServerError(null)
    setUnverified(null)
    setLoading(true)
    try {
      const res = await axiosInstance.post<LoginResponse>('/api/v1/auth/login', values)
      login(res.data)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } }).response?.data
        ?? (err as Error).message
        ?? 'Đăng nhập thất bại'
      if (typeof msg === 'string' && msg.includes('xác thực')) {
        setUnverified(values.email)
      } else {
        setServerError(typeof msg === 'string' ? msg : 'Tài khoản hoặc mật khẩu không đúng')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-title">Đăng nhập</div>
        <div className="auth-card-subtitle">Chào mừng trở lại</div>

        {serverError && (
          <Alert className="auth-server-error" type="error" message={serverError} showIcon />
        )}
        {unverified && (
          <Alert
            className="auth-server-error"
            type="warning"
            message={
              <span>
                Tài khoản chưa được xác thực.{' '}
                <Link to={`/verify?email=${encodeURIComponent(unverified)}`}>Xác thực ngay →</Link>
              </span>
            }
            showIcon
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email không được để trống' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="your@email.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Mật khẩu không được để trống' }]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test manually in browser**

```bash
npm run dev
```

- Truy cập `http://localhost:5173/login`
- Thử submit form rỗng → validation error hiện ra
- Thử email sai format → "Email không hợp lệ"
- Icon show/hide password hoạt động (Input.Password tự có)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/LoginPage.tsx
git commit -m "feat: implement LoginPage with validation and server error handling"
```

---

## Task 9: Build RegisterPage

**Files:**
- Modify: `frontend/src/pages/RegisterPage.tsx`

- [ ] **Step 1: Implement `src/pages/RegisterPage.tsx`**

```tsx
import { Alert, Button, Form, Input, Select } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'

interface RegisterFields {
  username: string
  email: string
  password: string
  confirmPassword: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
}

const PW_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

function getPwRules(pw: string) {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw) && /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  }
}

export function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm<RegisterFields>()
  const [password, setPassword] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const rules = getPwRules(password)
  const allRulesPass = Object.values(rules).every(Boolean)

  const onFinish = async (values: RegisterFields) => {
    setServerError(null)
    setLoading(true)
    try {
      await axiosInstance.post('/api/v1/auth/register', values)
      navigate(`/verify?email=${encodeURIComponent(values.email)}`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } }).response?.data
        ?? (err as Error).message
        ?? 'Đăng ký thất bại'
      setServerError(typeof msg === 'string' ? msg : 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-title">Tạo tài khoản</div>
        <div className="auth-card-subtitle">Điền thông tin để đăng ký</div>

        {serverError && (
          <Alert className="auth-server-error" type="error" message={serverError} showIcon />
        )}

        <Form layout="vertical" form={form} onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="username"
            label="Tên hiển thị"
            rules={[{ required: true, message: 'Tên hiển thị không được để trống' }]}
          >
            <Input placeholder="Nguyễn Văn A" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Email không được để trống' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="your@email.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Mật khẩu không được để trống' },
              { pattern: PW_REGEX, message: 'Mật khẩu chưa đáp ứng yêu cầu' },
            ]}
          >
            <Input.Password
              placeholder="••••••••"
              size="large"
              onChange={e => setPassword(e.target.value)}
            />
          </Form.Item>

          {/* Live password rules */}
          {password.length > 0 && (
            <div className="pw-rules">
              <div className={`pw-rule ${rules.length ? 'ok' : 'fail'}`}>
                {rules.length ? '✔' : '✕'} Ít nhất 8 ký tự
              </div>
              <div className={`pw-rule ${rules.upper ? 'ok' : 'fail'}`}>
                {rules.upper ? '✔' : '✕'} Có chữ hoa và chữ thường
              </div>
              <div className={`pw-rule ${rules.digit ? 'ok' : 'fail'}`}>
                {rules.digit ? '✔' : '✕'} Có ít nhất 1 chữ số
              </div>
              <div className={`pw-rule ${rules.special ? 'ok' : 'fail'}`}>
                {rules.special ? '✔' : '✕'} Có ký tự đặc biệt (@, #, !, ...)
              </div>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Mật khẩu không khớp'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true, message: 'Vui lòng chọn giới tính' }]}
          >
            <Select
              size="large"
              placeholder="Chọn giới tính"
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
                { value: 'OTHER', label: 'Khác' },
              ]}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={password.length > 0 && !allRulesPass}
              size="large"
              block
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test manually in browser**

```bash
npm run dev
```

- Truy cập `http://localhost:5173/register`
- Nhập password từng ký tự → checklist rules thay đổi real-time
- Submit form rỗng → các lỗi validation hiện ra
- Nhập 2 password không khớp → "Mật khẩu không khớp"

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/RegisterPage.tsx
git commit -m "feat: implement RegisterPage with live password rules and validation"
```

---

## Task 10: Build VerifyPage

**Files:**
- Modify: `frontend/src/pages/VerifyPage.tsx`

- [ ] **Step 1: Implement `src/pages/VerifyPage.tsx`**

```tsx
import { Alert, Button, Input, notification } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60
const OTP_VALIDITY = 15 * 60 // 15 phút theo BE config

export function VerifyPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [expire, setExpire] = useState(OTP_VALIDITY)
  const expireRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    expireRef.current = setInterval(() => {
      setExpire(prev => {
        if (prev <= 1) { clearInterval(expireRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => { if (expireRef.current) clearInterval(expireRef.current) }
  }, [])

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  if (user) return <Navigate to="/" replace />
  if (!email) return <Navigate to="/login" replace />

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleVerify = async () => {
    if (otp.length < OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 chữ số')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await axiosInstance.post('/api/v1/auth/verify', { email, verificationCode: otp })
      notification.success({ message: 'Xác thực tài khoản thành công!', duration: 3 })
      navigate('/login')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } }).response?.data
        ?? 'Mã xác thực không hợp lệ hoặc đã hết hạn'
      setError(typeof msg === 'string' ? msg : 'Mã xác thực không hợp lệ')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      await axiosInstance.post(`/api/v1/auth/resend?email=${encodeURIComponent(email)}`)
      notification.success({ message: 'Đã gửi lại mã xác thực', duration: 3 })
      setExpire(OTP_VALIDITY)
      startCooldown()
    } catch {
      notification.error({ message: 'Gửi lại thất bại, vui lòng thử lại' })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-title">Xác thực email</div>
        <div className="otp-hint">Mã xác thực đã gửi đến</div>
        <div className="otp-email">{email}</div>

        {error && (
          <Alert style={{ marginBottom: 14 }} type="error" message={error} showIcon />
        )}

        <Input.OTP
          length={OTP_LENGTH}
          value={otp}
          onChange={setOtp}
          size="large"
          style={{ width: '100%', justifyContent: 'center' }}
        />

        {expire > 0 ? (
          <div className="otp-expire">Mã hết hạn sau <span>{formatTime(expire)}</span></div>
        ) : (
          <div className="otp-expire" style={{ color: '#dc2626' }}>Mã đã hết hạn</div>
        )}

        <Button
          type="primary"
          size="large"
          block
          loading={loading}
          disabled={otp.length < OTP_LENGTH}
          onClick={handleVerify}
          style={{ marginTop: 8 }}
        >
          Xác thực tài khoản
        </Button>

        <div className="resend-row">
          Chưa nhận được mã?&nbsp;
          <Button
            type="link"
            size="small"
            disabled={cooldown > 0}
            onClick={handleResend}
            style={{ padding: 0, height: 'auto' }}
          >
            Gửi lại {cooldown > 0 && `(${cooldown}s)`}
          </Button>
        </div>

        <div className="auth-footer">
          <Link to="/login">← Quay về đăng nhập</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test manually in browser**

```bash
npm run dev
```

- Truy cập `http://localhost:5173/verify?email=test@test.com`
- Countdown 15:00 đang đếm ngược
- Submit khi OTP chưa đủ 6 số → disabled button
- Nhấn "Gửi lại" → cooldown 60s bắt đầu

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/VerifyPage.tsx
git commit -m "feat: implement VerifyPage with OTP input, expire countdown, and resend cooldown"
```

---

## Task 11: Build UserMenu

**Files:**
- Create: `frontend/src/components/UserMenu.tsx`
- Modify: `frontend/src/layouts/RootLayout.tsx` (thay UserMenuSlot bằng import thẳng)

- [ ] **Step 1: Create `src/components/UserMenu.tsx`**

```tsx
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
```

- [ ] **Step 2: Update RootLayout to use direct import**

Trong `src/layouts/RootLayout.tsx`, thay `UserMenuSlot` function và `require` bằng:

```tsx
// Thêm import ở đầu file (cùng với các import khác):
import { UserMenu } from '../components/UserMenu'
```

Và trong JSX, thay `{user && <UserMenuSlot />}` bằng:
```tsx
{user && <UserMenu />}
```

Xóa hoàn toàn function `UserMenuSlot`.

- [ ] **Step 3: Test manually in browser**

- Login thành công → header hiện avatar + tên
- Click avatar → dropdown mở ra với tên, email, role, My Images, Đăng xuất
- Click Đăng xuất → redirect về `/login`
- Click My Images → navigate tới `/my-images`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/UserMenu.tsx frontend/src/layouts/RootLayout.tsx
git commit -m "feat: add UserMenu dropdown with profile info, My Images link, and logout"
```

---

## Task 12: Build MyImagesPage

**Files:**
- Modify: `frontend/src/pages/MyImagesPage.tsx`

- [ ] **Step 1: Implement `src/pages/MyImagesPage.tsx`**

```tsx
import { Empty, Pagination, Skeleton } from 'antd'
import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'
import type { ImageItem } from '../types'

interface ImagePageResponse {
  items: ImageItem[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

export function MyImagesPage() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const PAGE_SIZE = 9

  useEffect(() => {
    const fetchImages = async () => {
      setLoading(true)
      try {
        const res = await axiosInstance.get<ImagePageResponse>('/api/images/mine', {
          params: { page: page - 1, size: PAGE_SIZE },
        })
        setImages(res.data.items)
        setTotal(res.data.totalItems)
      } catch {
        setImages([])
      } finally {
        setLoading(false)
      }
    }
    fetchImages()
  }, [page])

  return (
    <div className="my-images-shell">
      <div className="my-images-header">
        <h1>Ảnh của tôi</h1>
        <p>{total > 0 ? `${total} ảnh đã xử lý` : 'Chưa có ảnh nào'}</p>
      </div>

      {loading ? (
        <div className="images-grid">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Skeleton.Image key={i} active style={{ width: '100%', height: 200, borderRadius: 12 }} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <Empty
          description="Bạn chưa xử lý ảnh nào. Hãy thử pipeline ngay!"
          style={{ margin: '48px auto' }}
        />
      ) : (
        <div className="images-grid">
          {images.map(img => (
            <div key={img.id} className="image-grid-item">
              <img src={img.url} alt={img.id} loading="lazy" />
              <div className="image-grid-item-overlay">{timeAgo(img.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="images-pagination">
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Test manually in browser**

- Login → click "My Images" trong dropdown → navigate tới `/my-images`
- Nếu chưa có ảnh: hiển thị Empty state
- Xử lý 1 ảnh ở trang chủ, quay lại My Images → ảnh xuất hiện

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/MyImagesPage.tsx
git commit -m "feat: implement MyImagesPage with grid, skeleton loading, empty state, and pagination"
```

---

## Task 13: Add Silent Refresh Interceptor

**Files:**
- Modify: `frontend/src/api/axiosInstance.ts`

Interceptor bắt 401, thử refresh token, retry request gốc. Nếu refresh cũng fail → dispatch `auth:logout` event (AuthContext đã lắng nghe ở Task 3 → clear user → ProtectedRoute redirect về /login).

- [ ] **Step 1: Update `src/api/axiosInstance.ts`**

```ts
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(null)))
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const original = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(() => axiosInstance(original))
        .catch(err => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    try {
      await axiosInstance.get('/api/v1/auth/refresh')
      processQueue(null)
      return axiosInstance(original)
    } catch (refreshError) {
      processQueue(refreshError)
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default axiosInstance
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npm run test
```

Expected: all tests PASS.

- [ ] **Step 4: Test manually — full auth flow**

1. Đăng ký tài khoản mới → nhận email OTP
2. Xác thực OTP → redirect login
3. Đăng nhập → app hiện header với avatar + tên
4. Dùng pipeline xử lý ảnh → thành công
5. Vào My Images → ảnh xuất hiện trong gallery
6. Đăng xuất → redirect /login, truy cập `/` bị redirect lại /login

- [ ] **Step 5: Commit**

```bash
git add frontend/src/api/axiosInstance.ts
git commit -m "feat: add silent refresh interceptor — auto-retry 401s and force logout on refresh failure"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Covered by task |
|---|---|
| react-router-dom + routes | Task 7 |
| AuthContext (session check, login, logout) | Task 3 |
| axiosInstance withCredentials | Task 2 |
| Silent refresh interceptor | Task 13 |
| ProtectedRoute | Task 4 |
| RootLayout (ConfigProvider + Header) | Task 5 |
| App.tsx refactor | Task 6 |
| LoginPage + validation + server errors | Task 8 |
| RegisterPage + password rules | Task 9 |
| VerifyPage + OTP + countdown + resend | Task 10 |
| UserMenu dropdown | Task 11 |
| MyImagesPage + pagination | Task 12 |
| Auth CSS styles | Task 6 |
| Types (LoginResponse, UserResponse, ImageItem) | Task 1 |

**Placeholder scan:** Không có TBD, TODO, hay "similar to Task N".

**Type consistency:**
- `LoginResponse` defined in Task 1, used in Task 3 (AuthContext), Task 8 (LoginPage) ✓
- `ImageItem` defined in Task 1, used in Task 12 (MyImagesPage) ✓
- `axiosInstance` created in Task 2, imported identically across Tasks 3, 8, 9, 10, 12, 13 ✓
- `useAuth()` exported from `../context/AuthContext`, imported correctly in Tasks 4, 8, 9, 10, 11, 12 ✓
- `login()` function signature: `(user: LoginResponse) => void` — consistent Tasks 3 and 8 ✓
