import { Link, useLocation } from 'react-router-dom'
import {
  MessageSquare,
  Settings,
  Plug,
  Globe2,
  BarChart2,
  Megaphone,
  LogOut
} from 'lucide-react'

import { useAuthStore } from '../context/authStore'

const navItems = [
  { icon: MessageSquare, to: '/chat', label: 'Messages' },
  { icon: Megaphone, to: '/campaigns', label: 'Campaigns' },
  { icon: Plug, to: '/integrations', label: 'Integrations' },
  { icon: BarChart2, to: '/analytics', label: 'Analytics' },
  { icon: Settings, to: '/settings', label: 'Settings' }
]

export default function Sidebar() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const initials = user?.name
    ? user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??'

  return (
    <div className="w-[52px] bg-surface-900 border-r border-surface-700 flex flex-col items-center py-3 gap-1 shrink-0">
      {/* Logo */}
      <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center mb-3">
        <Globe2 size={16} className="text-white" />
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col gap-1 items-center w-full px-2">
        {navItems.map(({ icon: Icon, to, label }) => {
          const active = location.pathname === to

          return (
            <Link
              key={to}
              to={to}
              title={label}
              className={`w-full flex items-center justify-center h-9 rounded-lg transition-all ${
                active
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-surface-400 hover:bg-surface-700 hover:text-white'
              }`}
            >
              <Icon size={18} />
            </Link>
          )
        })}
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <button
          onClick={logout}
          title="Sign out"
          className="text-surface-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
        </button>

        <div className="w-8 h-8 bg-surface-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {initials}
        </div>
      </div>
    </div>
  )
}