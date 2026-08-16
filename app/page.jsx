'use client'
import Link from 'next/link'
import { getStatus, getStatusBySeverity } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label, Panel, LiveDot, StatTile, RadialGauge } from '@/components/ui'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo } from '@/lib/sensorHelpers'
import { MapPin, Map as MapIcon, ArrowUp, ChevronUp, ChevronDown, Minus, CheckCircle, Database, AlertTriangle, AlertOctagon, ShieldCheck, BellRing, Siren } from 'lucide-react'

import DamMap from '@/components/DamMap'

export default function DashboardPage() {
  const { user, isOperator, assignedDamId } = useAuth()
  const damIdForDashboard = isOperator && assignedDamId ? assignedDamId : 'all'
  const { alarms, unresolvedCount } = useAlarmData(damIdForDashboard)
  const { dams, stations, loading, error } = useDamData()
  const { t } = useLanguage()

  const visibleDams = isOperator && assignedDamId ? dams.filter(d => d.damId === assignedDamId) : dams
  const visibleStations = isOperator && assignedDamId ? stations.filter(s => s.damId === assignedDamId) : stations
  const visibleAlarms = isOperator && assignedDamId ? alarms.filter(a => a.damId === assignedDamId || !a.damId) : alarms

  const counts = {
    critical: visibleStations.filter(s => s.status === 'critical').length,
    danger: visibleStations.filter(s => s.status === 'danger').length,
    warning: visibleStations.filter(s => s.status === 'warning').length,
    safe: visibleStations.filter(s => s.status === 'safe').length,
  }

  const featured = visibleStations[0]
  const featuredStatus = getStatus(featured?.status)

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-3.5">
      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile icon={Database} label={t('dashboard.damList')} value={visibleDams.length} status="info" />
        <StatTile icon={Siren} label={t('status.critical')} value={counts.critical} status="critical" />
        <StatTile icon={AlertOctagon} label={t('status.danger')} value={counts.danger} status="danger" />
        <StatTile icon={AlertTriangle} label={t('status.warning')} value={counts.warning} status="warning" />
        <StatTile icon={ShieldCheck} label={t('status.safe')} value={counts.safe} status="safe" />
        <StatTile icon={BellRing} label="Chưa xử lý" value={unresolvedCount} status={unresolvedCount > 0 ? 'danger' : 'safe'} />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid items-start gap-3.5 grid-cols-1 lg:grid-cols-[260px_1fr_280px]">
        {/* ── LEFT ── */}
        <div className="space-y-3">
          <Panel
            title={t('dashboard.damList')}
            right={<Mono className="text-[10px] text-muted">{visibleDams.length} {t('dashboard.damCount')}</Mono>}
            bodyClassName="p-2.5"
          >
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
              {visibleDams.map(d => {
                const s = getStatus(d.status)
                return (
                  <div key={d.damId}
                    className={`bg-card2/60 border border-border border-l-[3px] ${s.leftBorder} rounded-lg p-2.5 hover:bg-card2 transition-colors`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-semibold text-tx truncate pr-2">{d.name}</span>
                      <Badge status={d.status} sm title={d.statusReason} />
                    </div>
                    <div className="flex items-center gap-3">
                      <RadialGauge value={d.fillPct} size={48} stroke={5} status={d.status} />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[8px] text-muted uppercase tracking-wide">{t('dashboard.waterLevel')}</span>
                          <Mono className={`text-[12px] font-bold ${s.text}`}>{d.waterLevel}m</Mono>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-[8px] text-muted uppercase tracking-wide">{t('damsPage.fillCapacity')}</span>
                          <Mono className="text-[11px] text-tx">{d.fillPct}%</Mono>
                        </div>
                      </div>
                    </div>
                    {d.statusReason && d.status !== 'safe' && (
                      <div className="mt-1.5 text-[8px] text-muted font-mono truncate border-t border-border/40 pt-1" title={d.statusReason}>
                        ⓘ {d.statusReason}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Panel>

          {/* Summary */}
          <Panel title={t('dashboard.stationOverview')}>
            {[[t('status.critical'), counts.critical, 'text-critical', 'bg-critical'], [t('status.danger'), counts.danger, 'text-danger', 'bg-danger'], [t('status.warning'), counts.warning, 'text-warning', 'bg-warning'], [t('status.safe'), counts.safe, 'text-safe', 'bg-safe']].map(([lb, ct, cl, dot]) => (
              <div key={lb} className="flex justify-between items-center mb-2.5 last:mb-0">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
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
          </Panel>
        </div>

        {/* ── CENTER ── */}
        <div className="space-y-3">
          {/* Leaflet GIS Map */}
          <Panel
            title={
              <span className="flex items-center gap-1.5">
                <MapIcon className="w-3 h-3" /> Bản đồ giám sát
              </span>
            }
            right={<span className="flex items-center gap-1.5"><LiveDot active /><span className="text-[10px] font-mono text-safe font-bold">LIVE</span></span>}
            bodyClassName="p-0"
            className="[&_.leaflet-container]:rounded-b-xl"
          >
            <DamMap dams={visibleDams} stations={visibleStations} height="420px" />
          </Panel>

          {/* Station cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {visibleStations.slice(0, 6).map(st => {
              const allNodes = (st.gateways || []).flatMap(g => g.nodes || [])
              const isUnlinked = (st.gateways && st.gateways.length > 0 && allNodes.length === 0) || (st.gateways && st.gateways.length === 0)
              const effectiveStatus = (st.status === 'unknown' || isUnlinked) ? 'unknown' : (st.status || 'unknown')
              const effectiveReason = (effectiveStatus === 'unknown' && !st.statusReason) ? 'Chưa gắn Sensor Node vào trạm' : (st.statusReason || '')
              const s = getStatus(effectiveStatus)
              const hasVal = effectiveStatus !== 'unknown' && st.waterLevel > 0

              return (
                <Link key={st.stationId} href={`/stations/${st.stationId}`}
                  className={`bg-card border border-border border-t-2 ${s.topBorder} rounded-xl p-3 cursor-pointer no-underline block
                    hover:-translate-y-0.5 hover:border-borderHi transition-all duration-150 shadow-panel`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-semibold text-tx">{st.name}</span>
                    <Badge status={effectiveStatus} sm title={effectiveReason} />
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <Mono className={`text-xl font-bold ${s.text}`}>{hasVal ? st.waterLevel : '--'}</Mono>
                    <span className="text-[9px] text-muted">m</span>
                    {hasVal && (
                      <span className={`text-[9px] ${st.change > 0 ? 'text-danger' : st.change < 0 ? 'text-safe' : 'text-muted'} inline-flex items-center gap-0.5`}>
                        {st.change > 0 ? <ChevronUp className="w-2.5 h-2.5 shrink-0" /> : st.change < 0 ? <ChevronDown className="w-2.5 h-2.5 shrink-0" /> : <Minus className="w-2.5 h-2.5 shrink-0" />}
                        <span>{Math.abs(st.change)}m</span>
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] text-muted mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-muted shrink-0" />
                    <span className="truncate">{st.location || `${st.river || ''} ${st.km || ''}`}</span>
                  </div>
                  {effectiveReason && effectiveStatus !== 'safe' && (
                    <div className="text-[8px] text-muted font-mono truncate bg-card2/80 px-1.5 py-0.5 rounded border border-border/40" title={effectiveReason}>
                      ⓘ {effectiveReason}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-1">
            <Link href="/dams"
              className="inline-block border border-border rounded-lg text-accent text-[11px] font-semibold px-4 py-1.5 no-underline hover:bg-accent/10 hover:border-accent/40 transition-colors">
              {t('dashboard.viewAllStations', { count: visibleStations.length })}
            </Link>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="space-y-3">
          {/* Featured station */}
          <Panel
            title="Trạm trọng điểm"
            right={featured && <Badge status={featured.status} sm />}
          >
            {featured ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {/* Station không có fillPct riêng — lấy mức chứa của Đập chứa nó (backend tự tính) */}
                  <RadialGauge value={visibleDams.find(d => d.damId === featured.damId)?.fillPct ?? 0} size={72} stroke={7} status={featured.status} label={`${featured.waterLevel}`} sublabel="mét" />
                  <div className="min-w-0">
                    <div className="text-base font-bold text-tx truncate">{featured.name}</div>
                    <div className="text-[10px] text-muted flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{featured.location}</span>
                    </div>
                    <p className={`text-[10px] mt-1.5 flex items-center gap-1 ${featured.change > 0 ? 'text-danger' : featured.change < 0 ? 'text-safe' : 'text-muted'}`}>
                      {featured.change > 0 ? <ChevronUp className="w-3 h-3 shrink-0" /> : featured.change < 0 ? <ChevronDown className="w-3 h-3 shrink-0" /> : <Minus className="w-3 h-3 shrink-0" />}
                      <span>{featured.change > 0 ? 'Tăng' : featured.change < 0 ? 'Giảm' : 'Ổn định'} {Math.abs(featured.change ?? 0)}m</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Độ ẩm', featured.humidity != null ? `${featured.humidity}%` : '—'],
                    ['Độ rung', featured.vibration != null ? `${featured.vibration} mm/s` : '—'],
                  ].map(([lb, val]) => (
                    <div key={lb} className="bg-card2/70 rounded-lg px-2.5 py-2 border border-border/50">
                      <div className="text-[8px] text-muted uppercase tracking-wide mb-1">{lb}</div>
                      <Mono className="text-[12px] text-tx font-semibold">{val}</Mono>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-[11px] text-muted text-center py-4">Chưa có dữ liệu trạm</div>
            )}
          </Panel>

          {/* Alerts — Real alarm data từ backend */}
          <Panel
            title="Cảnh báo mới nhất"
            right={
              <Mono className="text-[9px] text-danger bg-danger-soft px-1.5 py-0.5 rounded-full font-bold">
                {unresolvedCount} CHƯA XỬ LÝ
              </Mono>
            }
          >
            <div className="flex flex-col gap-2">
              {
                visibleAlarms.slice(0, 4).map(al => {
                  const s = getStatusBySeverity(al.severity)
                  const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
                  const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType

                  const station = visibleStations.find(st =>
                    (al.stationId && st.stationId === al.stationId) ||
                    st.stationId === al.sensorId
                  ) || visibleStations.find(st => st.damId === al.damId) || visibleStations[0] || stations[0]

                  const dam = visibleDams.find(d => d.damId === al.damId) || visibleDams.find(d => d.damId === station?.damId) || visibleDams[0] || dams[0]

                  const damName = al.damName || dam?.name || 'Đập Thủy Điện'
                  const damLoc = dam?.location || 'Hà Nội'
                  const stName = al.stationName || station?.name || 'Trạm Quan Trắc'
                  const stLoc = al.location || station?.location || 'Thân đập chính'

                  return (
                    <div key={al.id}
                      className={`bg-card2/60 border border-border border-l-[3px] ${s.leftBorder} rounded-lg p-2.5
                      ${al.resolvedAt ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between mb-1">
                        <span className={`font-mono text-[9px] uppercase font-bold ${s.text} flex items-center gap-1`}>
                          {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                          <span>{sevInfo.label}</span>
                        </span>
                        <span className="font-mono text-[9px] text-faint">{timeAgo(al.triggeredAt)} TRƯỚC</span>
                      </div>

                      <div className="text-[12px] font-bold text-tx mb-1">
                        {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                      </div>

                      {/* Vị trí Trạm & Đập */}
                      <div className="text-[10px] text-muted space-y-1 my-1 bg-card3/60 p-1.5 rounded-md border border-border/40">
                        <div className="text-tx font-bold flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate">{stName} ({stLoc})</span>
                        </div>
                        <div className="text-muted text-[9px] flex items-center gap-1.5">
                          <Database className="w-3 h-3 text-muted shrink-0" />
                          <span className="truncate">{damName} ({damLoc})</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              }
              {
                visibleAlarms.length === 0 && (
                  <div className="bg-card2/40 border border-border/60 rounded-lg px-2.5 py-4 text-center text-[10px] text-muted flex items-center justify-center gap-1.5">
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
          </Panel>
        </div>
      </div>
    </div>
  )
}
