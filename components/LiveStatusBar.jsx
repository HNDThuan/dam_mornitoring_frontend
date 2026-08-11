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
    <div className={`flex items-center gap-4 px-8 py-4 border-b border-border text-[14px]
      ${connected ? 'bg-safe/5' : 'bg-warning/5'}`}>
      {/* Connection dot */}
      <div className="flex items-center gap-1.5">
        <div className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${connected ? 'bg-safe' : 'bg-warning'}`} />
        <span className={connected ? 'text-safe font-semibold' : 'text-warning'}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Latest values */}
      {latest && (
        <>
          <div className="flex items-center gap-1 text-muted">
            <Droplet className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>{t('liveBar.waterLevel')}:</span>
            <Mono className="text-info font-semibold">{latest.waterLevel.toFixed(2)} m</Mono>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>{t('liveBar.moisture')}:</span>
            <Mono className="text-info font-semibold">{latest.moisture.toFixed(1)}%</Mono>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <Activity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>{t('liveBar.freq')}:</span>
            <Mono className="text-info font-semibold">{latest.freq.toFixed(2)} Hz</Mono>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{t('liveBar.amp')}:</span>
            <Mono className="text-info font-semibold">{latest.amp.toFixed(2)} mm</Mono>
          </div>
          <div className="ml-auto text-muted">
            {t('liveBar.updated')}: <Mono className="text-tx">{new Date(latest.timestamp).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : 'en-US')}</Mono>
          </div>
        </>
      )}

      {error && !latest && (
        <span className="text-warning">{error}</span>
      )}
    </div>
  )
}
