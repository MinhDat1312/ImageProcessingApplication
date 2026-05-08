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
