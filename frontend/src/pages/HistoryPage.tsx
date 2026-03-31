import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { resolveImageUrl } from '../utils/imageUrl'
import type { Analysis } from '../types'

const PAGE_LIMIT = 20

interface HistoryResponse {
  analyses: (Analysis & { _id?: string })[]
  total: number
  page: number
  limit: number
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-white p-4 animate-pulse shadow-sm">
      <div className="h-14 w-14 rounded-2xl bg-gray-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 rounded-full bg-gray-100" />
        <div className="h-3 w-32 rounded-full bg-gray-100" />
      </div>
    </div>
  )
}

const statusConfig: Record<Analysis['status'], { gradient: string; emoji: string; label: string }> = {
  completed: { gradient: 'from-emerald-400 to-teal-500', emoji: '✅', label: 'Completed' },
  pending: { gradient: 'from-yellow-400 to-orange-400', emoji: '⏳', label: 'Pending' },
  processing: { gradient: 'from-blue-400 to-violet-500', emoji: '🔄', label: 'Processing' },
  unreadable: { gradient: 'from-orange-400 to-red-400', emoji: '📷', label: 'Unreadable' },
  failed: { gradient: 'from-red-400 to-rose-500', emoji: '❌', label: 'Failed' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function getAnalysisId(analysis: Analysis & { _id?: string }): string {
  return analysis._id ?? analysis.id
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [analyses, setAnalyses] = useState<(Analysis & { _id?: string })[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)

  const fetchPage = useCallback(async (pageNum: number, append: boolean) => {
    if (!token) return
    try {
      const res = await fetch(`/api/analyses?page=${pageNum}&limit=${PAGE_LIMIT}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setError(true); return }
      const data: HistoryResponse = await res.json()
      setAnalyses((prev) => append ? [...prev, ...data.analyses] : data.analyses)
      setTotal(data.total)
      setPage(data.page)
    } catch { setError(true) }
  }, [token])

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetchPage(1, false).finally(() => setLoading(false))
  }, [fetchPage])

  const hasMore = analyses.length < total

  return (
    <div className="min-h-screen bg-[#F5F3FF]">
      <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-purple-200/30 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative bg-white/80 backdrop-blur-xl border-b border-white/60 px-5 pt-12 pb-5">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-500" />
          <h1 className="text-2xl font-black text-gray-900">History</h1>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">Your past product analyses</p>
      </div>

      <div className="relative px-5 py-5">
        {loading ? (
          <div className="space-y-3">
            <SkeletonRow /><SkeletonRow /><SkeletonRow />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-500 text-sm">Something went wrong. Please try again.</div>
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="h-20 w-20 rounded-3xl bg-white shadow-card flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <p className="font-bold text-gray-800">No analyses yet</p>
              <p className="text-sm text-gray-400 mt-1">Upload a product image to get started.</p>
            </div>
            <button
              onClick={() => navigate('/home')}
              className="rounded-2xl gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-glow"
            >
              Analyze a product
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => {
              const id = getAnalysisId(analysis)
              const cfg = statusConfig[analysis.status]
              const imgUrl = resolveImageUrl(analysis.imageUrl)

              return (
                <button
                  key={id}
                  onClick={() => navigate(`/analyses/${id}`)}
                  className="flex w-full items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-card border border-gray-50 transition-all hover:shadow-glow hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  {/* Thumbnail */}
                  <div className="h-14 w-14 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt="Product"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          const el = e.target as HTMLImageElement
                          el.style.display = 'none'
                          el.parentElement!.innerHTML = `<div class="h-full w-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-xl">${cfg.emoji}</div>`
                        }}
                      />
                    ) : (
                      <div className={`h-full w-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-xl`}>
                        {cfg.emoji}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-400 font-medium">{formatDate(analysis.createdAt)}</p>
                    {analysis.status === 'completed' && analysis.rating !== null ? (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-sm font-bold text-gray-900">Rating: {analysis.rating}/5</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <div key={s} className={`h-1.5 w-1.5 rounded-full ${s <= analysis.rating! ? 'bg-purple-500' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-gray-700 mt-0.5 capitalize">{cfg.label}</p>
                    )}
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                </button>
              )
            })}

            {hasMore && (
              <button
                onClick={async () => { setLoadingMore(true); await fetchPage(page + 1, true); setLoadingMore(false) }}
                disabled={loadingMore}
                className="w-full rounded-2xl bg-white border border-purple-100 py-3.5 text-sm font-semibold text-purple-600 shadow-sm transition-all hover:shadow-card disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
