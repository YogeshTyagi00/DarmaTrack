import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AnalysisProvider } from './context/AnalysisContext'
import Layout from './components/Layout'
import PageTransition from './components/PageTransition'
import LandingPage from './pages/LandingPage'
import OnboardingFlow from './pages/OnboardingFlow'
import HomePage from './pages/HomePage'
import AnalysisResult from './pages/AnalysisResult'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth()

  if (!token || !user) {
    return <Navigate to="/" replace />
  }

  if (!user.skinProfile) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth()

  if (!token || !user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const location = useLocation()

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <LandingPage />
              </PageTransition>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <PageTransition>
                  <OnboardingFlow />
                </PageTransition>
              </OnboardingRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <HomePage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analyses/:id"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <AnalysisResult />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <HistoryPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <ProfilePage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnalysisProvider>
          <AppRoutes />
        </AnalysisProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
