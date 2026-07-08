'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAlarmData } from '@/hooks/useAlarmData'
import { Home, ClipboardList, TrendingUp, AlertTriangle, Calendar, Droplets } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const { unresolvedCount } = useAlarmData()
  const NAV = [
    { href: '/', label: 'Trang Chủ', icon: Home, badge: 0 },
    { href: '/stations', label: 'Danh Sách Trạm', icon: ClipboardList, badge: 0 },
    { href: '/forecast', label: 'Dự Báo & Mô Phỏng', icon: TrendingUp, badge: 0 },
    { href: '/alerts', label: 'Cảnh Báo', icon: AlertTriangle, badge: unresolvedCount },
    { href: '/history', label: 'Lịch Sử', icon: Calendar, badge: 0 },
  ]
  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border flex items-center gap-1 px-4 h-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4 shrink-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white">
          <Droplets className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-sm text-tx tracking-wide whitespace-nowrap">
          DykeSafe Monitor
        </span>
      </div>
      {/* Nav links */}
      <div className="flex gap-0.5 flex-1 overflow-x-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold
                tracking-wide rounded-t whitespace-nowrap shrink-0 transition-all duration-150
                border-b-2 no-underline
                ${active
                  ? 'bg-accent/15 text-accent border-accent'
                  : 'bg-transparent text-muted border-transparent hover:text-tx hover:bg-white/5'
                }
              `}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              {label}
              {badge > 0 && (

                <span className="bg-danger text-white rounded-full text-[8px] px-1 py-0 font-bold leading-4 animate-pulse-dot">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
      {/* Admin */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-card2 rounded cursor-pointer shrink-0">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-[8px] text-white font-bold">
          AD
        </div>
        <span className="text-[11px] text-tx font-semibold">Admin</span>
      </div>
    </nav>
  )
}