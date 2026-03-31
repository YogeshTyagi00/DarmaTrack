import { NavLink } from 'react-router-dom'
import { Camera, Clock, User } from 'lucide-react'

const navItems = [
  { to: '/home', label: 'Analyze', Icon: Camera },
  { to: '/history', label: 'History', Icon: Clock },
  { to: '/profile', label: 'Profile', Icon: User },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-40">
      <div className="mx-4 mb-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-glow px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className="flex-1">
              {({ isActive }) => (
                <div className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl transition-all ${isActive ? 'bg-purple-50' : ''}`}>
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${isActive ? 'gradient-primary shadow-glow' : 'bg-gray-100'}`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  <span className={`text-[10px] font-semibold transition-colors ${isActive ? 'text-purple-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
