import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthProvider } from '../context/AuthContext'
import OnboardingFlow from '../pages/OnboardingFlow'

// Stub home page
function HomeStub() {
  return <div>home-page</div>
}

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function renderOnboarding() {
  const user = {
    id: '1',
    email: 'test@example.com',
    displayName: 'Test User',
    avatarUrl: '',
    skinProfile: null,
  }
  localStorage.setItem('auth_token', 'fake-jwt')
  localStorage.setItem('auth_user', JSON.stringify(user))

  return render(
    <MemoryRouter initialEntries={['/onboarding']}>
      <AuthProvider>
        <Routes>
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/home" element={<HomeStub />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('OnboardingFlow', () => {
  it('renders all required fields: skinType, age, concerns, allergies', () => {
    renderOnboarding()

    // skinType radio buttons
    expect(screen.getByRole('radio', { name: /oily/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /dry/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /sensitive/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /acne-prone/i })).toBeInTheDocument()

    // age input
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument()

    // concerns and allergies inputs
    expect(screen.getByPlaceholderText(/redness/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/fragrance/i)).toBeInTheDocument()
  })

  it('redirects to /home after successful save', async () => {
    const updatedUser = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
      avatarUrl: '',
      skinProfile: { skinType: 'oily', age: 25, concerns: [], allergies: [] },
    }

    server.use(
      http.post('/api/users/me/profile', () => {
        return HttpResponse.json(updatedUser)
      }),
    )

    renderOnboarding()

    // Fill in required fields
    fireEvent.click(screen.getByRole('radio', { name: /oily/i }))
    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '25' } })

    fireEvent.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() => {
      expect(screen.getByText('home-page')).toBeInTheDocument()
    })
  })
})
