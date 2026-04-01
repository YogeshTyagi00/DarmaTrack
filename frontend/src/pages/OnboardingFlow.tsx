import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SkinProfileForm from '../components/SkinProfileForm'
import { useAuth } from '../context/AuthContext'
import type { SkinProfile } from '../types'

import { apiUrl } from '../utils/api'

export default function OnboardingFlow() {
  const { token, user, login } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (values: SkinProfile) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch(apiUrl('/users/me/profile'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.message ?? 'Failed to save profile. Please try again.')
      }

      const updatedUser = await res.json()
      // Update auth context with the returned user (token stays the same)
      login(token!, updatedUser)
      navigate('/home')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start px-4 py-10">
      <div className="w-full max-w-[430px]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Set up your skin profile</h1>
          {user?.displayName && (
            <p className="mt-1 text-sm text-gray-500">Welcome, {user.displayName}! Tell us about your skin.</p>
          )}
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <SkinProfileForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
      </div>
    </div>
  )
}
