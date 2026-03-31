import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useAnalysisPoller from '../hooks/useAnalysisPoller'
import AnalysisCard from '../components/AnalysisCard'
import { resolveImageUrl } from '../utils/imageUrl'
import type { Analysis } from '../types'

function LoadingSkeleton() {
  return (
    <div className="space-y-4 px-5 py-6 animate-pulse">
      <div className="h-28 rounded-3xl bg-white/60" />
      <div className="h-32 rounded-3xl bg-white/60" />
      <div className="h-48 rounded-3xl bg-white/60" />
    </div>
  )
}

function ProcessingState() {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center px-5">
      <div className="relative">
        <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center shadow-glow">
          <RefreshCw className="h-8 w-8 text-white animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full gradient-primary opacity-30 animate-ping" />
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900">Analyzing your product</p>
        <p className="text-sm text-gray-500 mt-1">GPT-4o is reading the ingredients…</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 w-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuth()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (!id || !token) return
    void (async () => {
      try {
        const res = await fetch(`/api/analyses/${id}`, { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) setFetchError(true)
        else setAnalysis(await res.json())
      } catch { setFetchError(true) }
      finally { setLoading(false) }
    })()
  }, [id, token])

  const shouldPoll = !loading && !fetchError && analysis !== null &&
    (analysis.status === 'pending' || analysis.status === 'processing')

  const { analysis: polledAnalysis } = useAnalysisPoller(shouldPoll ? (id ?? null) : null, setAnalysis)
  useEffect(() => { if (polledAnalysis) setAnalysis(polledAnalysis) }, [polledAnalysis])

  if (loading) return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="h-24 bg-white/80 backdrop-blur animate-pulse" />
      <LoadingSkeleton />
    </div>
  )

  const errorState = (emoji: string, title: string, desc: string) => (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col items-center justify-center gap-5 px-5 text-center">
      <div className="h-20 w-20 rounded-3xl bg-white shadow-card flex items-center justify-center text-3xl">{emoji}</div>
      <div>
        <p className="text-lg font-bold text-gray-900">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>
      <button onClick={() => navigate('/home')} className="rounded-2xl gradient-primary px-8 py-3 text-sm font-semibold text-white shadow-glow">
        Try again
      </button>
    </div>
  )

  if (fetchError) return errorState('⚠️', 'Could not load analysis', 'Something went wrong fetching this result.')
  if (!analysis) return null
  if (analysis.status === 'pending' || analysis.status === 'processing') return (
    <div className="min-h-screen bg-[#F5F3FF]"><ProcessingState /></div>
  )
  if (analysis.status === 'unreadable') return errorState('📷', "Couldn't read ingredients", 'Try a clearer photo with better lighting.')
  if (analysis.status === 'failed') return errorState('❌', 'Analysis failed', 'Something went wrong. Please try again.')

  const imgUrl = resolveImageUrl(analysis.imageUrl)

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-white/60 px-5 pt-12 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-2xl bg-gray-100 flex items-center justify-center transition-colors hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900">Analysis Result</h1>
            <p className="text-xs text-gray-400">
              {new Date(analysis.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          {imgUrl && (
            <div className="h-11 w-11 rounded-2xl overflow-hidden ring-2 ring-purple-100 flex-shrink-0">
              <img src={imgUrl} alt="Product" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </div>

      <div className="relative px-5 py-5">
        <AnalysisCard analysis={analysis} />
        <button
          onClick={() => navigate('/home')}
          className="mt-5 w-full rounded-2xl bg-white border border-purple-100 py-3.5 text-sm font-semibold text-purple-600 shadow-sm transition-all hover:shadow-card active:scale-[0.98]"
        >
          Analyze another product
        </button>
      </div>
    </div>
  )
}
