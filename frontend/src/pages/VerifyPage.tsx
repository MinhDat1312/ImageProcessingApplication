import { Alert, Button, Input, notification } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'
import { useAuth } from '../context/AuthContext'
import type { ApiResponse } from '../types'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60
const OTP_VALIDITY = 15 * 60 // 15 phút theo BE config

const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

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

  const startExpireTimer = () => {
    if (expireRef.current) clearInterval(expireRef.current)
    setExpire(OTP_VALIDITY)
    expireRef.current = setInterval(() => {
      setExpire(prev => {
        if (prev <= 1) { clearInterval(expireRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => {
    startExpireTimer()
    return () => { if (expireRef.current) clearInterval(expireRef.current) }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }
  }, [])

  if (user) return <Navigate to="/" replace />
  if (!email) return <Navigate to="/login" replace />

  const startCooldown = () => {
    if (cooldownRef.current) clearInterval(cooldownRef.current)
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
    if (expire === 0) {
      setError('Mã xác thực đã hết hạn, vui lòng gửi lại')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await axiosInstance.post<ApiResponse<unknown>>('/api/v1/auth/verify', { email, verificationCode: otp })
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
      await axiosInstance.post<ApiResponse<unknown>>(`/api/v1/auth/resend?email=${encodeURIComponent(email)}`)
      notification.success({ message: 'Đã gửi lại mã xác thực', duration: 3 })
      startExpireTimer()
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
          disabled={otp.length < OTP_LENGTH || expire === 0}
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
