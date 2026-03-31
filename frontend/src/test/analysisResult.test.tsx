import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { AuthProvider } from '../context/AuthContext'
import { AnalysisProvider } from '../context/AnalysisContext'
import AnalysisResult from '../pages/AnalysisResult'
import type { Analysis } from '../types'

const server = setupServer()

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  localStorage.clear()
})
afterAll(() => server.close())

function makeAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: 'abc123',
    status: 'completed',
    imageUrl: 'https://example.com/img.jpg',
    ingredients: ['Water', 'Glycerin', 'Niacinamide'],
    rating: 4,
    explanation: 'This product is suitable for your skin type.',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function renderAnalysisResult(analysisId = 'abc123') {
  localStorage.setItem('auth_token', 'fake-jwt')
  localStorage.setItem(
    'auth_user',
    JSON.stringify({ id: '1', email: 'test@example.com', displayName: 'Test', avatarUrl: '', skinProfile: null }),
  )

  return render(
    <MemoryRouter initialEntries={[`/analyses/${analysisId}`]}>
      <AuthProvider>
        <AnalysisProvider>
          <Routes>
            <Route path="/analyses/:id" element={<AnalysisResult />} />
            <Route path="/home" element={<div>home-page</div>} />
          </Routes>
        </AnalysisProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AnalysisResult', () => {
  it('renders rating, ingredients, and explanation for a completed analysis', async () => {
    const analysis = makeAnalysis()
    server.use(
      http.get('/api/analyses/abc123', () => HttpResponse.json(analysis)),
    )

    renderAnalysisResult()

    await waitFor(() => {
      expect(screen.getByText('4/5')).toBeInTheDocument()
    })

    expect(screen.getByText('Water')).toBeInTheDocument()
    expect(screen.getByText('Glycerin')).toBeInTheDocument()
    expect(screen.getByText('Niacinamide')).toBeInTheDocument()
    expect(screen.getByText('This product is suitable for your skin type.')).toBeInTheDocument()
  })

  it('shows correct error message for unreadable status', async () => {
    const analysis = makeAnalysis({ status: 'unreadable', rating: null, explanation: null, ingredients: [] })
    server.use(
      http.get('/api/analyses/abc123', () => HttpResponse.json(analysis)),
    )

    renderAnalysisResult()

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't read the ingredients from this image/i),
      ).toBeInTheDocument()
    })
  })

  it('shows correct error message for failed status', async () => {
    const analysis = makeAnalysis({ status: 'failed', rating: null, explanation: null, ingredients: [] })
    server.use(
      http.get('/api/analyses/abc123', () => HttpResponse.json(analysis)),
    )

    renderAnalysisResult()

    await waitFor(() => {
      expect(screen.getByText(/analysis failed/i)).toBeInTheDocument()
    })
  })
})
