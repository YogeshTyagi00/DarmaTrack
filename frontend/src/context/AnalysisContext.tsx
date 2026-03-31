import { createContext, useContext, useState, ReactNode } from 'react'

interface AnalysisContextValue {
  activeAnalysisId: string | null
  setActiveAnalysisId: (id: string | null) => void
}

const AnalysisContext = createContext<AnalysisContextValue | null>(null)

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null)

  return (
    <AnalysisContext.Provider value={{ activeAnalysisId, setActiveAnalysisId }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis(): AnalysisContextValue {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider')
  return ctx
}
