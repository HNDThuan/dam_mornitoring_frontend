'use client'

import { useState } from 'react'
import Link from 'next/link'
import { STATIONS } from '@/lib/mockData'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'
import { useSensorData } from '@/hooks/useSensorData'
import { useAlarmData } from '@/hooks/useAlarmData'
import { getWaterStatus, calcDelta } from '@/lib/sensorHelpers'
import { Search, Check, Droplet, Cpu, Video, RefreshCw, MapPin, ChevronUp, ChevronDown, Minus } from 'lucide-react'

export default function StationsPage() {
  const [filter, setFilter] = useState({ danger: true, warning: true, safe: true })
  const [q, setQ] = useState('')

  const { latest, history } = useSensorData()
  const { thresholds } = useAlarmData()

  // Cập nhật dữ liệu động cho Trạm Hà Nội (ID 5)
  const dynamicStations = STATIONS.map(st => {
    if (st.id === 5 && latest) {
      const waterSt = getWaterStatus(latest.waterLevel, st.bd3, st.bd2, st.bd1, thresholds?.water_level)
      const waterDelta = calcDelta(history?.waterLevel)
      const changeVal = waterDelta.delta ? (waterDelta.up ? +waterDelta.delta : -waterDelta.delta) : 0

      const activeAlerts = [
        waterSt.label !== 'AN TOÀN' ? waterSt.label : null,
        latest.moisture >= (thresholds?.humidity?.alertHigh ?? 85) ? 'Độ ẩm cao' : null
      ].filter(Boolean)

      return {
        ...st,
        waterLevel: latest.waterLevel,
        status: waterSt.level, // 'danger' | 'warning' | 'safe'
        change: changeVal,
        alerts: activeAlerts.length > 0 ? activeAlerts : ['Hệ thống ổn định']
      }
    }
    return st
  })

  const shown = dynamicStations.filter(s =>
    filter[s.status] &&
    (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.location.toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div className="grid gap-3.5 p-4 min-h-[calc(100vh-48px)]" style={{ gridTemplateColumns: '220px 1fr' }}>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-3.5 self-start">
        <h2 className="text-[13px] font-bold text-tx mb-3.5">Bộ Lọc Nâng Cao</h2>

        {/* Search */}
        <div className="mb-3">
          <Label className="mb-1.5">Tên trạm</Label>
          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded px-2 py-1.5">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nhập tên trạm..."
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted" />
          </div>
        </div>

        {/* Status filter */}
        <div className="mb-3">
          <Label className="mb-2">Trạng thái vận hành</Label>
          {[['danger', 'Nguy hiểm', 'bg-danger'], ['warning', 'Cảnh báo', 'bg-warning'], ['safe', 'An toàn', 'bg-safe']].map(([k, lb, dotCl]) => (
            <div key={k} onClick={() => setFilter(p => ({ ...p, [k]: !p[k] }))}
              className="flex items-center gap-2 mb-2 cursor-pointer">
              <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center transition-all
                ${filter[k] ? `${dotCl} border-transparent` : 'bg-transparent border-border'}`}>
                {filter[k] && <Check className="w-2.5 h-2.5 text-white shrink-0" />}
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dotCl}`} />
                <span className="text-[12px] text-tx">{lb}</span>
              </div>
            </div>
          ))}
        </div>

        <Divider />

        {/* Region */}
        <div className="mb-3">
          <Label className="mb-1.5">Khu vực</Label>
          <select className="w-full bg-card2 border border-border rounded px-2 py-1.5 text-tx text-[11px] outline-none">
            <option>Tất cả khu vực</option>
            <option>Hà Nội</option>
            <option>Hưng Yên</option>
            <option>Nam Định</option>
          </select>
        </div>

        {/* Type */}
        <div className="mb-3">
          <Label className="mb-2">Loại trạm</Label>
          {[
            { icon: Droplet, lb: 'Mực nước', iconCl: 'text-sky-400' },
            { icon: Cpu, lb: 'Cảm biến đê', iconCl: 'text-indigo-400' },
            { icon: Video, lb: 'Camera giám sát', iconCl: 'text-emerald-400' }
          ].map(({ icon: Icon, lb, iconCl }) => (
            <div key={lb} className="flex items-center gap-2 bg-card2 border border-border rounded px-2.5 py-2 mb-1.5 text-[11px] text-tx cursor-pointer hover:bg-borderHi/30 transition-colors">
              {Icon && <Icon className={`w-3.5 h-3.5 ${iconCl} shrink-0`} />}
              <span>{lb}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-2 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-md text-white text-[12px] font-bold tracking-wide cursor-pointer border-none">
          ÁP DỤNG BỘ LỌC
        </button>
      </div>

      {/* List */}
      <div>
        <div className="flex justify-between items-end mb-3.5">
          <div>
            <h1 className="text-xl font-bold text-tx tracking-wide">DANH SÁCH TRẠM QUAN TRẮC</h1>
            <p className="text-[10px] text-muted mt-0.5">
              Thời gian thực — <Mono className="text-safe">{shown.length}</Mono> / {STATIONS.length} trạm hiển thị
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-muted text-[11px] font-medium bg-transparent hover:bg-white/5 transition-colors cursor-pointer">
            <RefreshCw className="w-3 h-3 shrink-0" />
            <span>Làm mới</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {shown.map(st => {
            const s = getStatus(st.status)
            return (
              <div key={st.id}
                className={`bg-card border border-border rounded-lg p-3.5 transition-all duration-150 hover:-translate-y-px hover:border-${st.status === 'danger' ? 'danger' : st.status === 'warning' ? 'warning' : 'safe'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-[12px] font-semibold text-tx">{st.name}</div>
                    <div className="text-[9px] text-muted mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted shrink-0" />
                      <span>{st.location}</span>
                    </div>
                  </div>
                  <Badge status={st.status} sm />
                </div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <Mono className={`text-2xl font-bold ${s.text}`}>{typeof st.waterLevel === 'number' ? st.waterLevel.toFixed(2) : st.waterLevel}</Mono>
                  <span className="text-[10px] text-muted">m</span>
                  <span className={`text-[9px] ${st.change > 0 ? 'text-danger' : st.change < 0 ? 'text-safe' : 'text-muted'} inline-flex items-center gap-0.5`}>
                    {st.change > 0 ? (
                      <ChevronUp className="w-3 h-3 shrink-0 text-danger" />
                    ) : st.change < 0 ? (
                      <ChevronDown className="w-3 h-3 shrink-0 text-safe" />
                    ) : (
                      <Minus className="w-3 h-3 shrink-0 text-muted" />
                    )}
                    <span>{Math.abs(st.change).toFixed(2)}m</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2.5">
                  {st.alerts.map((a, i) => (
                    <span key={i} className={`font-mono text-[8px] ${s.text} ${s.bg} px-1.5 py-0.5 rounded-sm`}>{a}</span>
                  ))}
                </div>
                <Link href={`/stations/${st.id}`}
                  className="block w-full py-1.5 text-center bg-transparent border border-borderHi rounded text-tx text-[10px] font-bold tracking-widest no-underline hover:border-accent hover:text-accent transition-colors">
                  CHI TIẾT TRẠM
                </Link>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-3.5">
          <Mono className="text-[10px] text-muted">Hiển thị 1–{shown.length} trong số {STATIONS.length} trạm</Mono>
          <div className="flex gap-1">
            {[1, 2, 3].map(n => (
              <button key={n} className={`w-6 h-6 rounded text-[11px] border cursor-pointer
                ${n === 1 ? 'bg-accent-soft border-accent text-accent' : 'bg-transparent border-border text-muted hover:bg-white/5'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
