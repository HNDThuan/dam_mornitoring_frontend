'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { Home, TrendingUp, AlertTriangle, Calendar, Database, Globe, Cpu, Users, LogOut, ShieldCheck, User, FileText, Eye, ChevronDown, UserCircle } from 'lucide-react'

export default function NavBar() {
  const pathname = usePathname()
  const { locale, toggleLanguage, t } = useLanguage()
  const { user, logout, isAdmin, isOperator, isViewer } = useAuth()

  const damIdForBadge = isOperator && user?.assignedDamId ? user.assignedDamId : 'all'
  const { unresolvedCount } = useAlarmData(damIdForBadge)

  const NAV = [
    { href: '/', label: t('nav.home'), icon: Home, badge: 0 },
    { href: '/dams', label: t('nav.dams'), icon: Database, badge: 0 },
  ]

  if (isAdmin || isOperator) {
    NAV.push({ href: '/alerts', label: t('nav.alerts'), icon: AlertTriangle, badge: unresolvedCount })
    NAV.push({ href: '/history', label: t('nav.history'), icon: Calendar, badge: 0 })
    NAV.push({ href: '/admin/nodes', label: t('nav.sensorNodes') || 'Sensor Node', icon: Cpu, badge: 0 })
  }

  if (isAdmin) {
    NAV.push({ href: '/users', label: 'Quản lý User', icon: Users, badge: 0 })
    NAV.push({ href: '/admin/logs', label: 'Nhật ký Hệ thống', icon: FileText, badge: 0 })
  }

  // Ẩn NavBar ở trang Login và Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  return (
    <header className="h-14 glass-nav border-b border-border/70 px-4 flex items-center justify-between sticky top-0 z-50 font-sans">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mr-4 shrink-0 no-underline group">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent2 via-accent to-indigo-600 flex items-center justify-center text-white shadow-glow shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <span className="font-bold text-[15px] text-tx tracking-wide whitespace-nowrap">
          {t('appName')}
        </span>
      </Link>

      {/* Nav Menu Items */}
      <nav className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
        {NAV.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all no-underline shrink-0 relative ${
                active
                  ? 'bg-accent/12 text-accent font-bold border border-accent/25'
                  : 'text-muted hover:text-tx hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-accent' : 'text-muted'}`} />
              <span>{label}</span>
              {badge > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-danger text-white font-mono text-[9px] font-bold rounded-full shadow-glow-danger animate-pulse">
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card2/70 border border-border rounded-lg text-[11px] font-bold text-tx cursor-pointer hover:border-accent/50 hover:text-accent transition-all shrink-0"
          title="Chuyển đổi ngôn ngữ / Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-accent" />
          <span>{locale === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* User Auth Info & Dropdown on Hover */}
        {user ? (
          <div className="relative group shrink-0">
            {/* Bo tròn dạng pill */}
            <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-card2/70 hover:bg-card border border-border hover:border-accent/40 rounded-full cursor-pointer transition-all duration-200">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent2 via-accent to-purple-500 flex items-center justify-center text-[9px] text-white font-bold uppercase shadow-inner">
                {user.username ? user.username.slice(0, 2) : 'US'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[11px] text-tx font-bold leading-tight max-w-[110px] truncate">
                  {user.fullName || user.username}
                </span>
                <span className="text-[8.5px] font-mono text-accent font-bold leading-none">
                  {user.role}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-muted group-hover:text-tx group-hover:rotate-180 transition-transform duration-200" />
            </div>

            {/* Dropdown Menu hiện ra khi hover */}
            <div className="absolute right-0 top-full pt-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 translate-y-1 transition-all duration-200 z-50">
              <div className="w-56 glass-panel rounded-2xl shadow-2xl p-3">
                {/* Header User Info */}
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent2 via-accent to-purple-500 flex items-center justify-center text-[12px] text-white font-bold uppercase shadow-sm shrink-0">
                    {user.username ? user.username.slice(0, 2) : 'US'}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[12px] text-tx font-bold truncate">
                      {user.fullName || user.username}
                    </span>
                    <span className="text-[10px] text-muted truncate">
                      {user.email || `@${user.username}`}
                    </span>
                    <span className="inline-block mt-0.5 text-[8.5px] font-mono font-bold text-accent px-1.5 py-0.2 bg-accent-soft border border-accent-soft rounded-md w-fit">
                      {user.role}
                    </span>
                  </div>
                </div>

                {/* Đập được phân công nếu có */}
                {user.assignedDamId && (
                  <div className="py-2 text-[10px] text-muted flex items-center justify-between border-b border-border">
                    <span>Đập phụ trách:</span>
                    <span className="font-mono font-bold text-tx uppercase">{user.assignedDamId}</span>
                  </div>
                )}

                {/* Hồ sơ cá nhân */}
                <div className="py-2 border-b border-border">
                  <Link
                    href="/profile"
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-tx hover:bg-white/5 no-underline transition-colors cursor-pointer"
                  >
                    <UserCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                </div>

                {/* Nút Logout */}
                <div className="pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold text-danger bg-danger/10 hover:bg-danger/20 border border-danger/20 hover:border-danger/40 cursor-pointer transition-all"
                    title="Đăng xuất khỏi hệ thống"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 bg-card2/70 border border-border rounded-lg text-[10px] text-muted font-bold font-mono hidden sm:flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>KHÁCH QUAN SÁT</span>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-br from-accent2 via-accent to-indigo-600 text-white rounded-lg text-[11px] font-bold hover:brightness-110 no-underline shrink-0 shadow-glow transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Đăng nhập Cán bộ</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}