import { useState, useEffect, useRef, useCallback } from 'react'
import type { Analysis } from '../types'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../utils/api'

const POLL_INTERVAL_MS = 5000
const TERMINAL_STATUSES = new Set<Analysis['status']>(['completed', 'unreadable', 'failed'])

function useAnalysisPoller(
  analysisId: string | null,
  onComplete?: (analysis: Analysis) => void
): { analysis: Analysis | null; isPolling: boolean } {
  const { token } = useAuth()
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const onCompleteRef = useRef(onComplete)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRef = useRef(false)

  // Keep onComplete ref up to date without restarting the effect
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const stopPolling = useCallback(() => {
    activeRef.current = false
    setIsPolling(false)
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const fetchAnalysis = useCallback(async (): Promise<void> => {
    if (!analysisId || !token || !activeRef.current) return

    try {
      const res = await fetch(apiUrl(`/analyses/${analysisId}`), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        // On error, stop polling to avoid hammering a broken endpoint
        stopPolling()
        return
      }

      const data: Analysis = await res.json()
      setAnalysis(data)

      if (TERMINAL_STATUSES.has(data.status)) {
        stopPolling()
        onCompleteRef.current?.(data)
        return
      }
    } catch {
      // Network error — stop polling
      stopPolling()
      return
    }

    // Schedule next poll only if still active
    if (activeRef.current) {
      timerRef.current = setTimeout(() => {
        void fetchAnalysis()
      }, POLL_INTERVAL_MS)
    }
  }, [analysisId, token, stopPolling])

  useEffect(() => {
    if (!analysisId || !token) {
      setAnalysis(null)
      setIsPolling(false)
      return
    }

    activeRef.current = true
    setIsPolling(true)

    // Kick off the first fetch immediately
    void fetchAnalysis()

    return () => {
      stopPolling()
    }
  }, [analysisId, token, fetchAnalysis, stopPolling])

  return { analysis, isPolling }
}

export default useAnalysisPoller
