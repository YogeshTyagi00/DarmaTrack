import { useNavigate } from 'react-router-dom'
import { Sparkles, Camera, Upload } from 'lucide-react'
import ImageUploader from '../components/ImageUploader'
import { useAnalysis } from '../context/AnalysisContext'
import useAnalysisPoller from '../hooks/useAnalysisPoller'
import { useAuth } from '../context/AuthContext'
import type { Analysis } from '../types'

export default function HomePage() {
  const { activeAnalysisId, setActiveAnalysisId } = useAnalysis()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleComplete = (analysis: Analysis) => {
    setActiveAnalysisId(null)
    navigate(`/analyses/${(analysis as Analysis & { _id?: string })._id ?? analysis.id}`)
  }

  useAnalysisPoller(activeAnalysisId, handleComplete)

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-200/40 blur-3xl pointer-events-none" />
      <div className="absolute top-20 left-0 w-48 h-48 rounded-full bg-pink-200/30 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-sm text-purple-500 font-medium">Hello, {firstName} 👋</p>
            <h1 className="text-2xl font-black text-gray-900 mt-0.5">DermaTrack</h1>
          </div>
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt="" className="h-10 w-10 rounded-full ring-2 ring-purple-200" />
          )}
        </div>
      </div>

      {/* Upload card */}
      <div className="relative px-5 pb-6">
        <div className="rounded-3xl bg-white shadow-card border border-purple-50 overflow-hidden">
          <div className="gradient-primary px-5 py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-white/80" />
              <p className="text-sm font-semibold text-white">Skin Product Analyser</p>
            </div>
            <p className="text-xs text-white/70 mt-0.5">Upload a product photo to get started</p>
          </div>
          <div className="p-5">
            <ImageUploader onAnalysisCreated={setActiveAnalysisId} />
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 rounded-2xl bg-white/60 backdrop-blur border border-purple-100 p-4">
          <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5" />
            Tips for best results
          </p>
          <ul className="space-y-1.5 text-xs text-gray-500">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Make sure the ingredient list is clearly visible
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Good lighting helps — avoid shadows and glare
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              JPEG, PNG or WEBP format, max 10 MB
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
