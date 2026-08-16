'use client'
import Link from 'next/link'
import { getStatus, getStatusBySeverity } from '@/lib/statusConfig'
import { useState, useRef, useLayoutEffect } from 'react'
import { Mono, Badge, Divider, Label, Panel, Card, LiveDot, StatTile, RadialGauge } from '@/components/ui'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo } from '@/lib/sensorHelpers'
import { MapPin, Map as MapIcon, ArrowUp, ChevronUp, ChevronDown, Minus, CheckCircle, Database, AlertTriangle, AlertOctagon, ShieldCheck, BellRing, Siren, LayoutDashboard, Radio } from 'lucide-react'

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

  const [centerTab, setCenterTab] = useState('map') // 'map' | 'stations'
  const tabBtnClass = (active) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer border-none transition-colors ${
      active ? 'bg-accent/15 text-accent' : 'bg-transparent text-muted hover:text-tx hover:bg-white/5'
    }`

  // Page height: measured from the real distance to the viewport bottom (not a hardcoded
  // "navbar is Npx" guess) so the whole dashboard fits one screen with no page scroll —
  // each column then stretches to fill it evenly instead of leaving mismatched gaps.
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (!pageRef.current) return
      const top = pageRef.current.getBoundingClientRect().top
      const h = Math.max(400, Math.floor(window.innerHeight - top))
      setPageHeight(prev => (prev === h ? prev : h))
    }
    updateHeight()

    // NavBar/LiveStatusBar sit above <main> and can grow after mount (nav items that
    // depend on the logged-in role, an alert badge, a wrapped row on a narrower window) —
    // a one-time top measurement would go stale and let the page scroll again, hiding the
    // header. Watch every sibling before <main> so any of that reflows the computed height.
    const mainEl = pageRef.current?.closest('main')
    const watched = []
    for (let sib = mainEl?.previousElementSibling; sib; sib = sib.previousElementSibling) {
      watched.push(sib)
    }

    const ro = new ResizeObserver(updateHeight)
    watched.forEach(el => ro.observe(el))
    window.addEventListener('resize', updateHeight)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return (
    <div
      ref={pageRef}
      style={pageHeight != null ? { height: pageHeight, maxHeight: pageHeight } : undefined}
      className="p-4 flex flex-col gap-4 overflow-hidden"
    >
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent-soft text-accent flex items-center justify-center shrink-0">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-tx tracking-wide m-0 leading-tight">Tổng Quan Hệ Thống</h1>
            <p className="text-[10px] text-muted m-0">Giám sát trạng thái đập và trạm quan trắc theo thời gian thực</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-safe-soft border border-safe-soft shrink-0">
          <LiveDot active />
          <span className="text-[10px] font-mono text-safe font-bold">LIVE</span>
        </span>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
        <StatTile compact icon={Database} label={t('dashboard.damList')} value={visibleDams.length} status="info" />
        <StatTile compact icon={Siren} label={t('status.critical')} value={counts.critical} status="critical" />
        <StatTile compact icon={AlertOctagon} label={t('status.danger')} value={counts.danger} status="danger" />
        <StatTile compact icon={AlertTriangle} label={t('status.warning')} value={counts.warning} status="warning" />
        <StatTile compact icon={ShieldCheck} label={t('status.safe')} value={counts.safe} status="safe" />
        <StatTile compact icon={BellRing} label={t('status.unresolved')} value={unresolvedCount} status={unresolvedCount > 0 ? 'danger' : 'safe'} />
      </div>

      {/* ── MAIN GRID — items-stretch so all 3 columns share the same height, no dead space ── */}
      <div className="grid items-stretch gap-4 grid-cols-1 lg:grid-cols-[260px_1fr_280px] flex-1 min-h-0">
        {/* ── LEFT ── */}
        <div className="h-full flex flex-col gap-3 min-h-0">
          <Panel
            title={t('dashboard.damList')}
            right={<Mono className="text-[10px] text-muted">{visibleDams.length} {t('dashboard.damCount')}</Mono>}
            className="flex-1 min-h-0 flex flex-col"
            bodyClassName="p-2.5 flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5"
          >
            {visibleDams.map(d => {
              const s = getStatus(d.status)
              return (
                <Link key={d.damId} href={`/dams/${d.damId}`}
                  title={d.statusReason || d.name}
                  className={`flex items-center gap-2 bg-card2/60 border border-border border-l-[3px] ${s.leftBorder} rounded-lg px-2.5 py-2 no-underline hover:bg-card2 transition-colors shrink-0`}>
                  <span className="text-[11px] font-semibold text-tx truncate flex-1 min-w-0">{d.name}</span>
                  <Mono className={`text-[11px] font-bold ${s.text} shrink-0`}>{d.waterLevel}m</Mono>
                  <Mono className="text-[10px] text-muted shrink-0 w-9 text-right">{d.fillPct}%</Mono>
                  <Badge status={d.status} sm className="shrink-0" />
                </Link>
              )
            })}
          </Panel>

          {/* Summary */}
          <Panel title={t('dashboard.stationOverview')} className="shrink-0">
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

        {/* ── CENTER — tabbed: Bản đồ / Trạm quan trắc (only one visible at a time) ── */}
        <div className="h-full flex flex-col min-h-0">
          <Card className="h-full flex flex-col min-h-0 overflow-hidden [&_.leaflet-container]:rounded-b-xl">
            <div className="flex items-center justify-between px-2.5 py-2 border-b border-border/70 shrink-0">
              <div className="flex items-center gap-1" role="tablist">
                <button role="tab" aria-selected={centerTab === 'map'} onClick={() => setCenterTab('map')} className={tabBtnClass(centerTab === 'map')}>
                  <MapIcon className="w-3 h-3" /> Bản đồ
                </button>
                <button role="tab" aria-selected={centerTab === 'stations'} onClick={() => setCenterTab('stations')} className={tabBtnClass(centerTab === 'stations')}>
                  <Radio className="w-3 h-3" /> Trạm quan trắc
                </button>
              </div>
              {centerTab === 'map' ? (
                <span className="flex items-center gap-1.5 shrink-0">
                  <LiveDot active /><span className="text-[10px] font-mono text-safe font-bold">LIVE</span>
                </span>
              ) : (
                <Mono className="text-[10px] text-muted shrink-0">{visibleStations.length} trạm</Mono>
              )}
            </div>

            {centerTab === 'map' ? (
              <div className="flex-1 min-h-0">
                <DamMap dams={visibleDams} stations={visibleStations} height="100%" />
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-y-auto p-3">
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
                <div className="text-center mt-3">
                  <Link href="/dams"
                    className="inline-block border border-border rounded-lg text-accent text-[11px] font-semibold px-4 py-1.5 no-underline hover:bg-accent/10 hover:border-accent/40 transition-colors">
                    {t('dashboard.viewAllStations', { count: visibleStations.length })}
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── RIGHT ── */}
        <div className="h-full flex flex-col gap-3 min-h-0">
          {/* Featured station */}
          <Panel
            title="Trạm trọng điểm"
            right={featured && <Badge status={featured.status} sm />}
            className="shrink-0"
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
            className="flex-1 min-h-0 flex flex-col"
            bodyClassName="p-3.5 flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-0.5">
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
                  const stName = al.stationName || station?.name || 'Trạm Quan Trắc'

                  return (
                    <div key={al.id}
                      className={`bg-card2/60 border border-border border-l-[3px] ${s.leftBorder} rounded-lg px-2.5 py-2 shrink-0
                      ${al.resolvedAt ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-mono text-[9px] uppercase font-bold ${s.text} flex items-center gap-1`}>
                          {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                          <span>{sevInfo.label}</span>
                        </span>
                        <span className="font-mono text-[9px] text-faint">{timeAgo(al.triggeredAt)} trước</span>
                      </div>

                      <div className="text-[12px] font-bold text-tx mb-0.5 truncate">
                        {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                      </div>

                      <div className="text-[9px] text-muted flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 text-muted shrink-0" />
                        <span className="truncate">{stName} · {damName}</span>
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
            <div className="text-center mt-2.5 shrink-0">
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
