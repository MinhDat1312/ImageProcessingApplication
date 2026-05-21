import { Alert, Button, Form, Input, Select } from 'antd'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import type { ApiResponse } from '../types'

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
      await axiosInstance.post<ApiResponse<unknown>>('/api/v1/auth/register', values)
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
