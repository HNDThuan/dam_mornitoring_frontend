'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Home, TrendingUp, AlertTriangle, Calendar, Database, Globe, Cpu, Users, LogOut, ShieldCheck, User } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const { locale, toggleLanguage, t } = useLanguage()
  const { user, logout, isAdmin, isOperator, isViewer } = useAuth()

  const damIdForBadge = isOperator && user?.assignedDamId ? user.assignedDamId : 'all'
  const { unresolvedCount } = useAlarmData(damIdForBadge)

  const NAV = [
    { href: '/', label: t('nav.home'), icon: Home, badge: 0 },
    { href: '/dams', label: t('nav.dams'), icon: Database, badge: 0 },
    { href: '/forecast', label: t('nav.forecast'), icon: TrendingUp, badge: 0 },
  ]

  if (isAdmin || isOperator) {
    NAV.push({ href: '/alerts', label: t('nav.alerts'), icon: AlertTriangle, badge: unresolvedCount })
    NAV.push({ href: '/history', label: t('nav.history'), icon: Calendar, badge: 0 })
    NAV.push({ href: '/admin/sensor-clusters', label: 'Cụm cảm biến', icon: Cpu, badge: 0 })
  }

  if (isAdmin) {
    NAV.push({ href: '/users', label: 'Quản lý User', icon: Users, badge: 0 })
  }

  // Ẩn NavBar ở trang Login và Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border flex items-center gap-2 px-4 h-12">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-3 shrink-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-bold text-base text-tx tracking-wide whitespace-nowrap">
          {t('appName')}
        </span>
      </div>

      {/* Nav links */}
      <div className="flex gap-1 flex-1 overflow-x-auto">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-[13px] font-bold
                tracking-wide rounded-t whitespace-nowrap shrink-0 transition-all duration-150
                border-b-2 no-underline
                ${active
                  ? 'bg-accent/15 text-accent border-accent'
                  : 'bg-transparent text-muted border-transparent hover:text-tx hover:bg-white/5'
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4 shrink-0" />}
              {label}
              {badge > 0 && (
                <span className="bg-danger text-white rounded-full text-[9px] px-1.5 py-0 font-bold leading-4 animate-pulse-dot">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Language Switcher */}
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-card2 border border-border rounded-lg text-[11px] font-bold text-tx cursor-pointer hover:border-accent hover:text-accent transition-all shrink-0 shadow-sm"
        title="Chuyển đổi ngôn ngữ / Switch Language"
      >
        <Globe className="w-4 h-4 text-accent" />
        <span>{locale === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
      </button>

      {/* User Auth Info & Logout */}
      {user ? (
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-card2 border border-border rounded-lg">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent to-sky-400 flex items-center justify-center text-[9px] text-white font-bold uppercase">
              {user.username ? user.username.slice(0, 2) : 'US'}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] text-tx font-bold leading-tight">{user.fullName || user.username}</span>
              <span className="text-[8px] font-mono text-accent font-bold leading-none">{user.role}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 bg-card2 border border-border rounded-lg text-danger hover:border-danger cursor-pointer transition-colors"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1 bg-card2 border border-border rounded-lg text-[10px] text-muted font-bold font-mono hidden sm:block">
            👁️ KHÁCH QUAN SÁT
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-[11px] font-bold hover:bg-accent/90 no-underline shrink-0 shadow"
          >
            <User className="w-3.5 h-3.5" />
            <span>Đăng nhập Cán bộ</span>
          </Link>
        </div>
      )}
    </nav>
  )
}