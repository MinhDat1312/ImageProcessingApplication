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
