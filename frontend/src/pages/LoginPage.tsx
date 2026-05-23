import { Alert, Form } from 'antd'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import { isAdminRole } from '../utils/roleUtils'
import type { ApiResponse, LoginResponse } from '../types'

interface LoginFields {
  email: string
  password: string
}

export function LoginPage() {
  const { user, login } = useAuth()
  const [serverError, setServerError] = useState<string | null>(null)
  const [unverified, setUnverified] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)

  useEffect(() => {
    if (user && justLoggedIn) {
      const isAdmin = user.role ? isAdminRole(user.role.name) : false
      window.location.replace(isAdmin ? '/admin' : '/')
      setJustLoggedIn(false)
    }
  }, [user, justLoggedIn])

  const onFinish = async (values: LoginFields) => {
    setServerError(null)
    setUnverified(null)
    setLoading(true)
    try {
      const res = await axiosInstance.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', values)
      login(res.data.data)
      const isAdmin = res.data.data.role ? isAdminRole(res.data.data.role.name) : false
      window.location.replace(isAdmin ? '/admin' : '/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } }).response?.data
        ?? (err as Error).message
        ?? 'Login failed'
      if (typeof msg === 'string' && (msg.includes('xác thực') || msg.toLowerCase().includes('unverified') || msg.toLowerCase().includes('not verified'))) {
        setUnverified(values.email)
      } else {
        setServerError(typeof msg === 'string' ? msg : 'Incorrect email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-title">Sign In</div>
        <div className="auth-card-subtitle">Welcome back</div>

        {serverError && (
          <Alert className="auth-server-error" type="error" message={serverError} showIcon />
        )}
        {unverified && (
          <Alert
            className="auth-server-error"
            type="warning"
            message={
              <span>
                Account is not verified yet.{' '}
                <Link to={`/verify?email=${encodeURIComponent(unverified)}`}>Verify now →</Link>
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
              { required: true, message: 'Email is required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="your@email.com" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Password is required' }]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 4 }}>
            <Button variant="primary" htmlType="submit" loading={loading} size="large" block>
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Sign Up</Link>
        </div>
      </div>
    </div>
  )
}
