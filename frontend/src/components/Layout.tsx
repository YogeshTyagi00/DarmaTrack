import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import AnalysisStatusIndicator from './AnalysisStatusIndicator'
import BottomNav from './BottomNav'

const SHOW_NAV_ROUTES = ['/home', '/history', '/profile', '/analyses']

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const showNav = SHOW_NAV_ROUTES.some((r) => pathname.startsWith(r))

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-gray-50 relative">
      <AnalysisStatusIndicator />
      <div className={showNav ? 'pb-20' : ''}>{children}</div>
      {showNav && <BottomNav />}
    </div>
  )
}
