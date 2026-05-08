import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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
    const handleForceLogout = () => setUser(null)
    window.addEventListener(AUTH_LOGOUT_EVENT, handleForceLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForceLogout)
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
