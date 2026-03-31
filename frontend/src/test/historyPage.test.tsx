import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthProvider } from '../context/AuthContext'
import HistoryPage from '../pages/HistoryPage'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function renderHistoryPage() {
  localStorage.setItem('auth_token', 'fake-jwt')
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ id: '1', email: 'test@example.com', displayName: 'Test', avatarUrl: '', skinProfile: null }),
  )

  return render(
    <MemoryRouter initialEntries={['/history']}>
      <AuthProvider>
        <Routes>
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/analyses/:id" element={<div>analysis-detail</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('HistoryPage', () => {
  it('shows loading skeleton while fetching', async () => {
    // Use a delayed response so the skeleton is visible
    server.use(
      http.get('/api/analyses', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ analyses: [], total: 0, page: 1, limit: 20 })
      }),
    )

    renderHistoryPage()

    // Skeleton should be present immediately before data loads
    expect(screen.getByLabelText('Loading history')).toBeInTheDocument()

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByLabelText('Loading history')).not.toBeInTheDocument()
    })
  })

  it('renders a list of past analyses after loading', async () => {
    const analyses = [
      {
        _id: 'id1',
        id: 'id1',
        status: 'completed',
        imageUrl: '',
        ingredients: [],
        rating: 4,
        explanation: 'Good',
        createdAt: new Date('2024-06-01').toISOString(),
      },
      {
        _id: 'id2',
        id: 'id2',
        status: 'unreadable',
        imageUrl: '',
        ingredients: [],
        rating: null,
        explanation: null,
        createdAt: new Date('2024-05-01').toISOString(),
      },
    ]

    server.use(
      http.get('/api/analyses', () =>
        HttpResponse.json({ analyses, total: 2, page: 1, limit: 20 }),
      ),
    )

    renderHistoryPage()

    await waitFor(() => {
      expect(screen.getByText('Rating: 4/5')).toBeInTheDocument()
    })

    expect(screen.getAllByText('completed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('unreadable').length).toBeGreaterThan(0)
  })
})
