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
        ?? 'Registration failed'
      setServerError(typeof msg === 'string' ? msg : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-title">Create Account</div>
        <div className="auth-card-subtitle">Fill in the details to register</div>

        {serverError && (
          <Alert className="auth-server-error" type="error" message={serverError} showIcon />
        )}

        <Form layout="vertical" form={form} onFinish={onFinish} requiredMark={false}>
          <Form.Item
            name="username"
            label="Display Name"
            rules={[{ required: true, message: 'Display Name is required' }]}
          >
            <Input placeholder="John Doe" size="large" />
          </Form.Item>

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
            rules={[
              { required: true, message: 'Password is required' },
              { pattern: PW_REGEX, message: 'Password does not meet requirements' },
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
                {rules.length ? '✔' : '✕'} At least 8 characters
              </div>
              <div className={`pw-rule ${rules.upper ? 'ok' : 'fail'}`}>
                {rules.upper ? '✔' : '✕'} Contain uppercase & lowercase
              </div>
              <div className={`pw-rule ${rules.digit ? 'ok' : 'fail'}`}>
                {rules.digit ? '✔' : '✕'} Contain at least 1 digit
              </div>
              <div className={`pw-rule ${rules.special ? 'ok' : 'fail'}`}>
                {rules.special ? '✔' : '✕'} Contain special character (@, #, !, ...)
              </div>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>

          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: 'Please select your gender' }]}
          >
            <Select
              size="large"
              placeholder="Select gender"
              options={[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
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
              Sign Up
            </Button>
          </Form.Item>
        </Form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  )
}
