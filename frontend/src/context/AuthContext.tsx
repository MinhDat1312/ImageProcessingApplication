import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import axiosInstance from '../api/axiosInstance'
import type { LoginResponse } from '../types'
import { AUTH_LOGOUT_EVENT } from '../types'

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
  // Use ref so the event listener always reads the current value without re-subscribing
  const isLoggingInRef = useRef(false)

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

  // Listen for forced logout from the silent-refresh interceptor (Task 13)
  useEffect(() => {
    const handleForceLogout = () => {
      if (!isLoggingInRef.current) {
        setUser(null)
      }
    }
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout)
  }, [])

  const login = (userData: LoginResponse) => {
    isLoggingInRef.current = true
    setUser(userData)
    setIsLoading(false)
    // Reset flag after a delay — any interceptor chain triggered by the login request will have fired by then
    setTimeout(() => {
      isLoggingInRef.current = false
    }, 2000)
  }

  const logout = async () => {
    isLoggingInRef.current = false
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
