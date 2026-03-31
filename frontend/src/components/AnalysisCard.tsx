import { Beaker, Star, FileText, ChevronRight } from 'lucide-react'
import type { Analysis } from '../types'

interface AnalysisCardProps {
  analysis: Analysis
}

function RatingDisplay({ rating }: { rating: number }) {
  const configs = {
    1: { gradient: 'from-red-500 to-rose-600', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-600', label: 'Not Recommended', desc: 'May cause irritation' },
    2: { gradient: 'from-orange-500 to-red-500', bg: 'bg-orange-50', border: 'border-orange-100', text: 'text-orange-600', label: 'Use with Caution', desc: 'Some concerning ingredients' },
    3: { gradient: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-50', border: 'border-yellow-100', text: 'text-yellow-600', label: 'Neutral', desc: 'Neither good nor bad' },
    4: { gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', label: 'Good Match', desc: 'Suitable for your skin' },
    5: { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-100', text: 'text-violet-600', label: 'Excellent Match', desc: 'Perfect for your skin type' },
  }
  const cfg = configs[rating as keyof typeof configs] ?? configs[3]

  return (
    <div className={`rounded-3xl ${cfg.bg} border ${cfg.border} p-5 overflow-hidden relative`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br opacity-10 blur-xl" />
      <div className="flex items-center gap-4">
        <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
          <span className="text-2xl font-black text-white">{rating}</span>
        </div>
        <div className="flex-1">
          <p className={`text-base font-bold ${cfg.text}`}>{cfg.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
          <div className="flex gap-1 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-all ${s <= rating ? `bg-gradient-to-r ${cfg.gradient}` : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisCard({ analysis }: AnalysisCardProps) {
  const { rating, ingredients, explanation } = analysis

  return (
    <div className="space-y-4">
      {rating !== null && <RatingDisplay rating={rating} />}

      {explanation && (
        <div className="rounded-3xl bg-white shadow-card border border-gray-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-xl bg-violet-100 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <h2 className="text-sm font-bold text-gray-800">Expert Analysis</h2>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">{explanation}</p>
        </div>
      )}

      {ingredients && ingredients.length > 0 && (
        <div className="rounded-3xl bg-white shadow-card border border-gray-50 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Beaker className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-800">Ingredients</h2>
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
              {ingredients.length} found
            </span>
          </div>
          <ul className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {ingredients.map((ingredient, i) => (
              <li key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
