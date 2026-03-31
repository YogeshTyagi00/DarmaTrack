import { render, screen, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'

// Component that calls logout and shows current auth state
function SignOutButton() {
  const { logout, token } = useAuth()
  return (
    <div>
      <span data-testid="token">{token ?? 'no-token'}</span>
      <button onClick={logout}>Sign out</button>
    </div>
  )
}

function LandingStub() {
  return <div>landing-page</div>
}

function AppWithSignOut() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingStub />} />
        <Route path="/profile" element={<SignOutButton />} />
      </Routes>
    </AuthProvider>
  )
}

describe('Sign-out', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('clears JWT from localStorage on logout', () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test',
      avatarUrl: '',
      skinProfile: { skinType: 'oily', age: 25, concerns: [], allergies: [] },
    }
    localStorage.setItem('auth_token', 'fake-jwt')
    localStorage.setItem('auth_user', JSON.stringify(user))

    const { getByRole, getByTestId } = render(
      <MemoryRouter initialEntries={['/profile']}>
        <AppWithSignOut />
      </MemoryRouter>,
    )

    expect(getByTestId('token').textContent).toBe('fake-jwt')

    act(() => {
      getByRole('button', { name: /sign out/i }).click()
    })

    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(localStorage.getItem('auth_user')).toBeNull()
    expect(getByTestId('token').textContent).toBe('no-token')
  })
})
