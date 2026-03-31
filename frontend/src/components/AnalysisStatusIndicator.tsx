import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalysis } from '../context/AnalysisContext'
import useAnalysisPoller from '../hooks/useAnalysisPoller'
import type { Analysis } from '../types'

const NOTIFICATION_DURATION_MS = 4000

const IN_PROGRESS_STATUSES = new Set<Analysis['status']>(['pending', 'processing'])

function statusMessage(status: Analysis['status']): string {
  if (status === 'completed') return 'Analysis complete!'
  if (status === 'unreadable') return "Couldn't read the ingredients. Try a clearer photo."
  if (status === 'failed') return 'Analysis failed. Please try again.'
  return 'Analyzing your product…'
}

export default function AnalysisStatusIndicator() {
  const { activeAnalysisId, setActiveAnalysisId } = useAnalysis()
  const navigate = useNavigate()
  const [notification, setNotification] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  const { analysis } = useAnalysisPoller(activeAnalysisId, (completed) => {
    setNotification(statusMessage(completed.status))
    setActiveAnalysisId(null)

    if (completed.status === 'completed') {
      const id = (completed as Analysis & { _id?: string })._id ?? completed.id
      setTimeout(() => {
        navigate(`/analyses/${id}`)
        setNotification(null)
        setVisible(false)
      }, 1500)
    } else {
      setTimeout(() => {
        setNotification(null)
        setVisible(false)
      }, NOTIFICATION_DURATION_MS)
    }
  })

  // Show banner whenever there's an active in-progress analysis
  useEffect(() => {
    if (activeAnalysisId && analysis && IN_PROGRESS_STATUSES.has(analysis.status)) {
      setVisible(true)
    } else if (activeAnalysisId && !analysis) {
      // Analysis just started, show immediately
      setVisible(true)
    }
  }, [activeAnalysisId, analysis])

  // Show notification banner
  useEffect(() => {
    if (notification) setVisible(true)
  }, [notification])

  if (!visible) return null

  const isInProgress = activeAnalysisId !== null && (!analysis || IN_PROGRESS_STATUSES.has(analysis.status))
  const isNotification = notification !== null

  if (!isInProgress && !isNotification) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2 text-sm font-medium text-white shadow-md transition-colors ${
        isNotification
          ? notification?.includes('complete')
            ? 'bg-green-600'
            : 'bg-red-600'
          : 'bg-indigo-600'
      }`}
    >
      {isInProgress && !isNotification && (
        <>
          <svg
            className="mr-2 h-4 w-4 animate-spin flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 12 0 12 12H4z"
            />
          </svg>
          Analyzing your product…
        </>
      )}
      {isNotification && <span>{notification}</span>}
    </div>
  )
}
