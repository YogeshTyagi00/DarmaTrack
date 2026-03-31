import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'
import LandingPage from '../pages/LandingPage'

// Helper to render LandingPage with routing and auth
function renderLandingPage(initialEntries: string[] = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <LandingPage />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders the Google sign-in button', () => {
    renderLandingPage()
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument()
  })

  it('shows the app title', () => {
    renderLandingPage()
    expect(screen.getByText('Skincare Analyzer')).toBeInTheDocument()
  })
})
