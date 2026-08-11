'use client'

import { useSensorData } from '@/hooks/useSensorData'
import { useLanguage } from '@/context/LanguageContext'
import { Mono } from '@/components/ui'
import { Droplet, CloudRain, Activity, TrendingUp } from 'lucide-react'

export default function LiveStatusBar() {
  const { latest, connected, error } = useSensorData()
  const { t, locale } = useLanguage()

  if (!connected && !latest) return null

  return (
    <div className={`flex items-center gap-6 px-8 py-3 border-b border-border text-[15px] font-medium
      ${connected ? 'bg-safe/10' : 'bg-warning/10'}`}>
      {/* Connection dot */}
      <div className="flex items-center gap-2">
        <div className={`w-2.5 h-2.5 rounded-full animate-pulse-dot ${connected ? 'bg-safe' : 'bg-warning'}`} />
        <span className={connected ? 'text-safe font-bold tracking-wider' : 'text-warning font-bold'}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Latest values */}
      {latest && (
        <>
          <div className="flex items-center gap-1.5 text-muted">
            <Droplet className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="font-semibold">{t('liveBar.waterLevel')}:</span>
            <Mono className="text-info font-bold text-[15px]">{latest.waterLevel.toFixed(2)} m</Mono>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <CloudRain className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="font-semibold">{t('liveBar.moisture')}:</span>
            <Mono className="text-info font-bold text-[15px]">{latest.moisture.toFixed(1)}%</Mono>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-semibold">{t('liveBar.freq')}:</span>
            <Mono className="text-info font-bold text-[15px]">{latest.freq.toFixed(2)} Hz</Mono>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <TrendingUp className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="font-semibold">{t('liveBar.amp')}:</span>
            <Mono className="text-info font-bold text-[15px]">{latest.amp.toFixed(2)} mm</Mono>
          </div>
          <div className="ml-auto text-muted text-[13px]">
            {t('liveBar.updated')}: <Mono className="text-tx font-bold">{new Date(latest.timestamp).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US')}</Mono>
          </div>
        </>
      )}

      {error && !latest && (
        <span className="text-warning font-bold">{error}</span>
      )}
    </div>
  )
}
