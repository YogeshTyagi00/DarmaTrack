import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Edit3 } from 'lucide-react'
import SkinProfileForm from '../components/SkinProfileForm'
import { useAuth } from '../context/AuthContext'
import type { SkinProfile } from '../types'

export default function ProfilePage() {
  const { token, user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSubmit = async (values: SkinProfile) => {
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      const res = await fetch('/api/users/me/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Failed to save.')
      login(token!, await res.json())
      setSuccessMessage('Profile updated successfully!')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="absolute top-0 left-0 w-56 h-56 rounded-full bg-pink-200/30 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-white/60 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-500" />
            <h1 className="text-2xl font-black text-gray-900">Profile</h1>
          </div>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      <div className="relative px-5 py-5 space-y-4">
        {/* User card */}
        <div className="rounded-3xl bg-white shadow-card border border-gray-50 p-5">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-purple-100" />
            ) : (
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-black text-white">
                {user?.displayName?.[0] ?? '?'}
              </div>
            )}
            <div>
              <p className="font-bold text-gray-900 text-base">{user?.displayName}</p>
              <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Skin profile form */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Edit3 className="h-4 w-4 text-purple-500" />
            <h2 className="text-sm font-bold text-gray-800">Skin Profile</h2>
          </div>

          {errorMessage && (
            <div role="alert" className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}
          {successMessage && (
            <div role="status" className="mb-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600 font-medium">
              ✅ {successMessage}
            </div>
          )}

          <div className="rounded-3xl bg-white shadow-card border border-gray-50 p-5">
            <SkinProfileForm initialValues={user?.skinProfile ?? undefined} onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  )
}
