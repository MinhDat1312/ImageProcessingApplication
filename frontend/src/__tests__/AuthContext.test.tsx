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
    mockedAxios.get = vi.fn().mockResolvedValueOnce({ data: { data: fakeUser } })

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.user).toEqual(fakeUser)
  })

  it('sets user=null when /users fails on mount', async () => {
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
    mockedAxios.get = vi.fn().mockResolvedValueOnce({ data: { data: fakeUser } })
    mockedAxios.post = vi.fn().mockResolvedValueOnce({})

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual(fakeUser))

    await result.current.logout()
    expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/auth/logout')
    await waitFor(() => expect(result.current.user).toBeNull())
  })

  it('clears user when auth:logout event is dispatched', async () => {
    mockedAxios.get = vi.fn().mockResolvedValueOnce({ data: { data: fakeUser } })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.user).toEqual(fakeUser))

    window.dispatchEvent(new CustomEvent('auth:logout'))
    await waitFor(() => expect(result.current.user).toBeNull())
  })
})
