import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Sparkles, Leaf } from 'lucide-react'

import { apiUrl } from '../utils/api'

function buildGoogleOAuthUrl(): string {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI as string
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export default function LandingPage() {
  const { login, user, token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token && user) navigate(user.skinProfile ? '/home' : '/onboarding', { replace: true })
  }, [token, user, navigate])

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) return
    setLoading(true)
    fetch(apiUrl('/auth/google'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Authentication failed. Please try again.')
        return res.json() as Promise<{ token: string; user: Parameters<typeof login>[1] }>
      })
      .then(({ token: jwt, user: userData }) => {
        login(jwt, userData)
        navigate(userData.skinProfile ? '/home' : '/onboarding', { replace: true })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong.')
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col">
      {/* Hero gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-pink-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-violet-200/20 blur-3xl" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 h-20 w-20 rounded-3xl gradient-primary flex items-center justify-center shadow-glow">
            <Leaf className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gradient">DermaTrack</h1>
          <p className="mt-2 text-center text-gray-500 text-sm max-w-xs leading-relaxed">
            Click a product photo and get product analysis personalized for your skin.
          </p>
        </div>

        {/* Feature pills */}
        {/* <div className="flex flex-wrap gap-2 justify-center mb-8">
          {['🔬 Ingredient Analysis', '⭐ Personalized Rating', '📊 Skin Insights'].map((f) => (
            <span key={f} className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur text-xs font-medium text-purple-700 shadow-sm border border-purple-100">
              {f}
            </span>
          ))}
        </div> */}

        {/* Error */}
        {error && (
          <div className="mb-5 w-full max-w-sm rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Sign in button */}
        <div className="w-full max-w-sm space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-4 text-sm text-gray-500">
              <div className="h-5 w-5 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
              Signing you in…
            </div>
          ) : (
            <button
              onClick={() => { setError(null); window.location.href = buildGoogleOAuthUrl() }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-gray-700 shadow-card border border-gray-100 transition-all hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <svg width="20" height="20" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
              </svg>
              Continue with Google
            </button>
          )}

          {error && (
            <button
              onClick={() => { setError(null); window.location.href = buildGoogleOAuthUrl() }}
              className="w-full rounded-2xl gradient-primary py-4 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Try again
            </button>
          )}
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
