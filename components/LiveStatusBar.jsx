'use client'

import { usePathname } from 'next/navigation'
import { useSensorData } from '@/hooks/useSensorData'
import { useLanguage } from '@/context/LanguageContext'
import { Mono, LiveDot, Divider } from '@/components/ui'
import { Droplet, CloudRain, Activity, TrendingUp } from 'lucide-react'

function Reading({ icon: Icon, iconClass, label, value }) {
  return (
    <div className="flex items-center gap-1.5 text-muted shrink-0">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${iconClass}`} />
      <span className="text-[11px] font-semibold hidden sm:inline">{label}</span>
      <Mono className="text-tx font-bold text-[12px]">{value}</Mono>
    </div>
  )
}

export default function LiveStatusBar() {
  const pathname = usePathname()
  const { latest, connected, error } = useSensorData()
  const { t, locale } = useLanguage()

  // Ẩn LiveStatusBar ở trang Login và Register
  if (pathname === '/login' || pathname === '/register') {
    return null
  }

  if (!connected && !latest) return null

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b border-border/70 bg-card/40 text-[12px] overflow-x-auto">
      {/* Connection status */}
      <div className="flex items-center gap-2 shrink-0">
        <LiveDot active={connected} />
        <span className={`font-mono font-bold tracking-wider text-[11px] ${connected ? 'text-safe' : 'text-warning'}`}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {latest && (
        <>
          <Divider vertical className="h-4" />
          <Reading icon={Droplet} iconClass="text-sky-400" label={t('liveBar.waterLevel')} value={`${(latest.waterLevel ?? 0).toFixed(2)} m`} />
          <Reading icon={CloudRain} iconClass="text-blue-400" label={t('liveBar.moisture')} value={`${(latest.moisture ?? 0).toFixed(1)}%`} />
          <Reading icon={Activity} iconClass="text-indigo-400" label={t('liveBar.freq')} value={`${(latest.freq ?? 0).toFixed(2)} Hz`} />
          <Reading icon={TrendingUp} iconClass="text-orange-400" label={t('liveBar.amp')} value={`${(latest.amp ?? 0).toFixed(2)} mm`} />

          <div className="ml-auto text-faint text-[10px] shrink-0 whitespace-nowrap">
            {t('liveBar.updated')}:{' '}
            <Mono className="text-muted font-bold">
              {latest.timestamp
                ? new Date(latest.timestamp).toLocaleTimeString(
                    locale === 'vi' ? 'vi-VN' : 'en-US',
                  )
                : '--:--:--'}
            </Mono>
          </div>
        </>
      )}

      {error && !latest && (
        <span className="text-warning font-bold">{error}</span>
      )}
    </div>
  )
}
