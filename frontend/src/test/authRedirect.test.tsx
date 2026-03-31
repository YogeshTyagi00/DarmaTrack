import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import LandingPage from '../pages/LandingPage'

// Stub pages so we can detect redirects
function OnboardingStub() {
  return <div>onboarding-page</div>
}
function HomeStub() {
  return <div>home-page</div>
}

function AppWithRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<OnboardingStub />} />
        <Route path="/home" element={<HomeStub />} />
      </Routes>
    </AuthProvider>
  )
}

describe('Auth redirect logic', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects to /onboarding when user has no skin profile', () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test',
      avatarUrl: '',
      skinProfile: null,
    }
    localStorage.setItem('auth_token', 'fake-jwt')
    localStorage.setItem('auth_user', JSON.stringify(user))

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppWithRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByText('onboarding-page')).toBeInTheDocument()
  })

  it('redirects to /home when user has a skin profile', () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test',
      avatarUrl: '',
      skinProfile: {
        skinType: 'oily',
        age: 25,
        concerns: [],
        allergies: [],
      },
    }
    localStorage.setItem('auth_token', 'fake-jwt')
    localStorage.setItem('auth_user', JSON.stringify(user))

    render(
      <MemoryRouter initialEntries={['/']}>
        <AppWithRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByText('home-page')).toBeInTheDocument()
  })
})
