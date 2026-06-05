'use client'

import { useSensorData } from '@/hooks/useSensorData'
import { Mono } from '@/components/ui'

export default function LiveStatusBar() {
  const { latest, connected, error } = useSensorData()

  if (!connected && !latest) return null

  return (
    <div className={`flex items-center gap-4 px-4 py-2 border-b border-border text-[10px]
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
            <span>💧</span>
            <span>Mực nước:</span>
            <Mono className="text-info font-semibold">{latest.waterLevel.toFixed(2)} m</Mono>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <span>🌫️</span>
            <span>Độ ẩm:</span>
            <Mono className="text-info font-semibold">{latest.moisture.toFixed(1)}%</Mono>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <span>📳</span>
            <span>Tần số rung:</span>
            <Mono className="text-info font-semibold">{latest.freq.toFixed(2)} Hz</Mono>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <span>📊</span>
            <span>Biên độ:</span>
            <Mono className="text-info font-semibold">{latest.amp.toFixed(2)} mm</Mono>
          </div>
          <div className="ml-auto text-muted">
            Cập nhật: <Mono className="text-tx">{new Date(latest.timestamp).toLocaleTimeString('vi-VN')}</Mono>
          </div>
        </>
      )}

      {error && !latest && (
        <span className="text-warning">{error}</span>
      )}
    </div>
  )
}
