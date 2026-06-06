'use client'
import Link from 'next/link'
import { DAMS, STATIONS } from '@/lib/mockData'
import { getStatus, getStatusBySeverity } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'
import { useAlarmData } from '@/hooks/useAlarmData'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo } from '@/lib/sensorHelpers'
export default function DashboardPage() {
  const { alarms, unresolvedCount } = useAlarmData()
  const counts = {
    danger: STATIONS.filter(s => s.status === 'danger').length,
    warning: STATIONS.filter(s => s.status === 'warning').length,
    safe: STATIONS.filter(s => s.status === 'safe').length,
  }
  return (
    <div className="grid gap-3.5 p-4 min-h-[calc(100vh-48px)]"
      style={{ gridTemplateColumns: '245px 1fr 265px' }}>
      {/* ── LEFT ── */}
      <div>
        <Label>
          Danh sách đập
          <span className="float-right font-normal">{DAMS.length} đập</span>
        </Label>
        <div className="flex flex-col gap-2 mb-3.5">
          {DAMS.map(d => {
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
                    <div className="text-[8px] text-muted uppercase tracking-wide">Mực nước</div>
                    <Mono className={`text-[13px] ${s.text}`}>{d.waterLevel}m</Mono>
                  </div>
                  <div>
                    <div className="text-[8px] text-muted uppercase tracking-wide">Lưu lượng</div>
                    <Mono className="text-[12px] text-tx">{d.flow.toLocaleString()} m³/s</Mono>
                  </div>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-[8px] text-muted">Mức chứa</span>
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
          <Label className="mb-2.5">Tổng quan trạm</Label>
          {[['Nguy hiểm', counts.danger, 'text-danger'], ['Cảnh báo', counts.warning, 'text-warning'], ['An toàn', counts.safe, 'text-safe']].map(([lb, ct, cl]) => (
            <div key={lb} className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${lb === 'Nguy hiểm' ? 'bg-danger' : lb === 'Cảnh báo' ? 'bg-warning' : 'bg-safe'}`} />
                <span className="text-[12px] text-tx">{lb}</span>
              </div>
              <Mono className={`text-base font-bold ${cl}`}>{ct}</Mono>
            </div>
          ))}
          <Divider />
          <div className="flex justify-between">
            <span className="text-[11px] text-muted">Tổng hoạt động</span>
            <Mono className="text-[13px] text-tx">{STATIONS.length} trạm</Mono>
          </div>
        </div>
      </div>
      {/* ── CENTER ── */}
      <div>
        {/* Map placeholder */}
        <div className="rounded-lg border border-border mb-3.5 h-44 flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#0a1628,#0d2040,#091220)' }}>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 40% 50%,rgba(56,189,248,.06) 0%,transparent 60%)' }} />
          <div className="relative text-center">
            <div className="text-3xl mb-1.5">🗺️</div>
            <div className="text-[13px] font-bold text-tx tracking-widest">BẢN ĐỒ ĐIỂM NÓNG</div>
            <div className="text-[10px] text-muted mt-1">Tích hợp bản đồ GIS đang phát triển</div>
            <div className="flex gap-3.5 mt-2.5 justify-center">
              {[['bg-danger', '2 Nguy hiểm'], ['bg-warning', '4 Cảnh báo'], ['bg-safe', '2 An toàn']].map(([cl, lb]) => (
                <div key={lb} className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${cl}`} />
                  <span className="text-[9px] text-muted">{lb}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Station cards grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {STATIONS.slice(0, 6).map(st => {
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
                  <span className={`text-[9px] ${st.change > 0 ? 'text-danger' : st.change < 0 ? 'text-safe' : 'text-muted'}`}>
                    {st.change > 0 ? '↑' : st.change < 0 ? '↓' : '—'}{Math.abs(st.change)}m
                  </span>
                </div>
                <div className="text-[9px] text-muted mb-1.5">📍 {st.location}</div>
                <span className={`text-[8px] font-mono ${s.text} ${s.bg} px-1.5 py-0.5 rounded`}>{st.alerts[0]}</span>
              </Link>
            )
          })}
        </div>
        <div className="text-center mt-3">
          <Link href="/stations"
            className="inline-block border border-border rounded text-accent text-[11px] font-semibold px-4 py-1.5 no-underline hover:bg-white/5 transition-colors">
            Xem tất cả {STATIONS.length} trạm →
          </Link>
        </div>
      </div>
      {/* ── RIGHT ── */}
      <div>
        {/* Featured station */}
        <div className="bg-card border border-border rounded-lg p-3.5 mb-3.5">
          <Label>Trạm trọng điểm</Label>
          <div className="flex justify-between items-center my-2">
            <span className="text-base font-bold text-tx">Hà Nội</span>
            <span className="font-mono text-[9px] text-warning bg-warning-soft px-2 py-0.5 rounded-sm">BÁO ĐỘNG 1</span>
          </div>
          <Mono className="text-[40px] font-bold text-warning leading-none block">
            6.12<span className="text-sm text-muted font-sans"> m</span>
          </Mono>
          <p className="text-[10px] text-danger mt-1 mb-3">↑ Tăng nhanh (+0.05m/h)</p>
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
              alarms.slice(0, 4).map(al => {
                const s = getStatusBySeverity(al.severity)
                const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
                const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType
                return (
                  <div key={al.id}

                    className={`bg-card border border-border border-l-[3px] ${s.leftBorder} rounded px-2.5 py-2
                    ${al.resolvedAt ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between mb-1">

                      <span className={`font-mono text-[8px] uppercase ${s.text}`}>
                        {sevInfo.icon} {sevInfo.label}
                      </span>
                      <span className="font-mono text-[8px] text-muted">{timeAgo(al.triggeredAt)} TRƯỚC</span>
                    </div>
                    <div className="text-[11px] font-semibold text-tx mb-1">{al.title}</div>
                    <div className="text-[9px] text-muted">📍 {al.location}</div>
                    <div className="text-[11px] font-semibold text-tx mb-1">
                      {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                    </div>
                    <div className="text-[9px] text-muted">🆔 {al.sensorId}</div>
                  </div>
                )
              })
            }
            {
              alarms.length === 0 && (
                <div className="bg-card border border-border rounded px-2.5 py-4 text-center text-[10px] text-muted">
                  ✅ Không có cảnh báo — Hệ thống ổn định
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