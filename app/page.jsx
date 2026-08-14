'use client'
import Link from 'next/link'
import { getStatus, getStatusBySeverity } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo } from '@/lib/sensorHelpers'
import { MapPin, Map, ArrowUp, ChevronUp, ChevronDown, Minus, CheckCircle } from 'lucide-react'

import DamMap from '@/components/DamMap'

export default function DashboardPage() {
  const { user, isOperator, assignedDamId } = useAuth()
  const damIdForDashboard = isOperator && assignedDamId ? assignedDamId : 'all'
  const { alarms, unresolvedCount } = useAlarmData(damIdForDashboard)
  const { dams, stations, loading, error } = useDamData()
  const { t } = useLanguage()

  const visibleDams = isOperator && assignedDamId ? dams.filter(d => d.id === assignedDamId) : dams
  const visibleStations = isOperator && assignedDamId ? stations.filter(s => s.damId === assignedDamId) : stations
  const visibleAlarms = isOperator && assignedDamId ? alarms.filter(a => a.damId === assignedDamId || !a.damId) : alarms

  const counts = {
    danger: visibleStations.filter(s => s.status === 'danger').length,
    warning: visibleStations.filter(s => s.status === 'warning').length,
    safe: visibleStations.filter(s => s.status === 'safe').length,
  }
  return (
    <div className="grid gap-3.5 p-4 min-h-[calc(100vh-48px)]"
      style={{ gridTemplateColumns: '245px 1fr 265px' }}>
      {/* ── LEFT ── */}
      <div>
        <Label>
          {t('dashboard.damList')}
          <span className="float-right font-normal">{visibleDams.length} {t('dashboard.damCount')}</span>
        </Label>
        <div className="flex flex-col gap-2 mb-3.5">
          {visibleDams.map(d => {
            const s = getStatus(d.status)
            return (
              <div key={d.id}
                className={`bg-card border border-border border-l-4 ${s.leftBorder} rounded-md p-2.5`}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-semibold text-tx">{d.name}</span>
                  <Badge status={d.status} sm />
                </div>
                <div className="flex gap-3 mb-2">
                  <div>
                    <div className="text-[8px] text-muted uppercase tracking-wide">{t('dashboard.waterLevel')}</div>
                    <Mono className={`text-[13px] ${s.text}`}>{d.waterLevel}m</Mono>
                  </div>
                  <div>
                    <div className="text-[8px] text-muted uppercase tracking-wide">{t('dashboard.flow')}</div>
                    <Mono className="text-[12px] text-tx">{d.flow ? d.flow.toLocaleString() : 0} m³/s</Mono>
                  </div>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[8px] text-muted">{t('dashboard.fillPct')}</span>
                  <Mono className="text-[8px] text-tx">{d.fillPct}%</Mono>
                </div>
                <div className="h-1 bg-border rounded-sm">
                  <div className={`h-full rounded-sm ${s.dot}`} style={{ width: `${d.fillPct}%`, opacity: 0.7 }} />
                </div>
              </div>
            )
          })}
        </div>
        {/* Summary */}
        <div className="bg-card border border-border rounded-md p-3">
          <Label className="mb-2.5">{t('dashboard.stationOverview')}</Label>
          {[[t('status.danger'), counts.danger, 'text-danger'], [t('status.warning'), counts.warning, 'text-warning'], [t('status.safe'), counts.safe, 'text-safe']].map(([lb, ct, cl]) => (
            <div key={lb} className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${lb === t('status.danger') ? 'bg-danger' : lb === t('status.warning') ? 'bg-warning' : 'bg-safe'}`} />
                <span className="text-[12px] text-tx">{lb}</span>
              </div>
              <Mono className={`text-base font-bold ${cl}`}>{ct}</Mono>
            </div>
          ))}
          <Divider />
          <div className="flex justify-between">
            <span className="text-[11px] text-muted">{t('dashboard.totalActive')}</span>
            <Mono className="text-[13px] text-tx">{visibleStations.length} trạm</Mono>
          </div>
        </div>
      </div>
      {/* ── CENTER ── */}
      <div>
        {/* Leaflet GIS Map */}
        <div className="mb-3.5">
          <DamMap dams={visibleDams} stations={visibleStations} height="420px" />
        </div>
        {/* Station cards grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {visibleStations.slice(0, 6).map(st => {
            const s = getStatus(st.status)
            return (
              <Link key={st.id} href={`/stations/${st.id}`}
                className={`bg-card border border-border border-t-2 ${s.topBorder} rounded-md p-3 cursor-pointer no-underline block
                  hover:-translate-y-px transition-transform duration-150`}>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-[11px] font-semibold text-tx">{st.name}</span>
                  <Badge status={st.status} sm />
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <Mono className={`text-xl font-bold ${s.text}`}>{st.waterLevel}</Mono>
                  <span className="text-[9px] text-muted">m</span>
                  <span className={`text-[9px] ${st.change > 0 ? 'text-danger' : st.change < 0 ? 'text-safe' : 'text-muted'} inline-flex items-center gap-0.5`}>
                    {st.change > 0 ? <ChevronUp className="w-2.5 h-2.5 shrink-0" /> : st.change < 0 ? <ChevronDown className="w-2.5 h-2.5 shrink-0" /> : <Minus className="w-2.5 h-2.5 shrink-0" />}
                    <span>{Math.abs(st.change)}m</span>
                  </span>
                </div>
                <div className="text-[9px] text-muted mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted shrink-0" />
                  <span>{st.location}</span>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="text-center mt-3">
          <Link href="/dams"
            className="inline-block border border-border rounded text-accent text-[11px] font-semibold px-4 py-1.5 no-underline hover:bg-white/5 transition-colors">
            {t('dashboard.viewAllStations', { count: visibleStations.length })}
          </Link>
        </div>
      </div>
      {/* ── RIGHT ── */}
      <div>
        {/* Featured station */}
        <div className="bg-card border border-border rounded-lg p-3.5 mb-3.5">
          <Label>Trạm trọng điểm</Label>
          <div className="flex justify-between items-center my-2">
            <span className="text-base font-bold text-tx">{visibleStations[0]?.name || 'Hà Nội'}</span>
            <span className="font-mono text-[9px] text-warning bg-warning-soft px-2 py-0.5 rounded-sm">BÁO ĐỘNG 1</span>
          </div>
          <Mono className="text-[40px] font-bold text-warning leading-none block">
            6.12<span className="text-sm text-muted font-sans"> m</span>
          </Mono>
          <p className="text-[10px] text-danger mt-1 mb-3 flex items-center gap-1">
            <ArrowUp className="w-3 h-3 shrink-0" />
            <span>Tăng nhanh (+0.05m/h)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[['Áp lực', '1.2 atm'], ['Lưu lượng', '2,450 m³/s']].map(([lb, val]) => (
              <div key={lb} className="bg-card2 rounded px-2.5 py-2">
                <div className="text-[8px] text-muted uppercase tracking-wide mb-1">{lb}</div>
                <Mono className="text-[12px] text-tx">{val}</Mono>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts — Real alarm data từ backend */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="mb-0">Cảnh báo mới nhất</Label>

            <Mono className="text-[9px] text-danger bg-danger-soft px-1.5 py-0.5 rounded-sm">
              {unresolvedCount} CHƯA XỬ LÝ
            </Mono>
          </div>
          <div className="flex flex-col gap-2">
            {
              visibleAlarms.slice(0, 4).map(al => {
                const s = getStatusBySeverity(al.severity)
                const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
                const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType

                const station = visibleStations.find(st => 
                  (al.stationId && String(st.id) === String(al.stationId)) ||
                  String(st.id) === String(al.sensorId)
                ) || visibleStations.find(st => st.damId === al.damId) || visibleStations[0] || stations[0]

                const dam = visibleDams.find(d => d.id === al.damId) || visibleDams.find(d => d.id === station?.damId) || visibleDams[0] || dams[0]

                const damName = al.damName || dam?.name || 'Đập Thủy Điện'
                const damLoc = dam?.location || 'Hà Nội'
                const stName = al.stationName || station?.name || 'Trạm Quan Trắc'
                const stLoc = al.location || station?.location || 'Thân đập chính'

                return (
                  <div key={al.id}
                    className={`bg-card border border-border border-l-[3px] ${s.leftBorder} rounded-lg p-2.5
                    ${al.resolvedAt ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between mb-1">
                      <span className={`font-mono text-[9px] uppercase font-bold ${s.text} flex items-center gap-1`}>
                        {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                        <span>{sevInfo.label}</span>
                      </span>
                      <span className="font-mono text-[9px] text-muted">{timeAgo(al.triggeredAt)} TRƯỚC</span>
                    </div>

                    <div className="text-[12px] font-bold text-tx mb-1">
                      {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                    </div>

                    {/* Vị trí Trạm & Đập */}
                    <div className="text-[10px] text-muted space-y-0.5 my-1 bg-card2 p-1.5 rounded border border-border/40">
                      <div className="text-tx font-bold">📍 {stName} ({stLoc})</div>
                      <div className="text-muted text-[9px]">🏞️ {damName} ({damLoc})</div>
                    </div>
                  </div>
                )
              })
            }
            {
              visibleAlarms.length === 0 && (
                <div className="bg-card border border-border rounded px-2.5 py-4 text-center text-[10px] text-muted flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-safe shrink-0" />
                  <span>Không có cảnh báo — Hệ thống ổn định</span>
                </div>
              )
            }
          </div>
          <div className="text-center mt-2.5">
            <Link href="/alerts" className="text-[10px] text-accent font-semibold no-underline hover:underline">
              Xem tất cả thông báo →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}