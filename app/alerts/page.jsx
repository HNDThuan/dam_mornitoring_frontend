'use client'

import { useState, useMemo } from 'react'
import { useAlarmData } from '@/hooks/useAlarmData'
import { getStatusBySeverity } from '@/lib/statusConfig'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo, formatTime } from '@/lib/sensorHelpers'
import { Mono, Badge, Divider, Label } from '@/components/ui'

export default function AlertsPage() {
  const { alarms, thresholds, loading, error, resolveAlarm, unresolvedCount } = useAlarmData()
  const [selId, setSelId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'CRITICAL' | 'ALERT' | 'WARNING' | 'resolved'
  const [modes, setModes] = useState({ sms: true, zalo: true, email: false })
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const [fullImg, setFullImg] = useState(false)

  // Tự chọn alarm đầu tiên nếu chưa chọn
  const sel = useMemo(() => {
    if (selId) return alarms.find(a => a.id === selId) || alarms[0] || null
    return alarms[0] || null
  }, [selId, alarms])

  // Cập nhật message template khi chọn alarm khác
  const defaultMsg = useMemo(() => {
    if (!sel) return ''
    const sevInfo = SEVERITY_MAP[sel.severity] || SEVERITY_MAP.WARNING
    const typeLb = SENSOR_TYPE_LABELS[sel.sensorType] || sel.sensorType
    const unit = SENSOR_TYPE_UNITS[sel.sensorType] || ''
    return `[${sevInfo.label}] Cảnh báo ${typeLb} tại đập ${sel.damId}. Giá trị đo: ${sel.measuredVal} ${unit} (Ngưỡng: ${sel.thresholdVal} ${unit}). ${sel.notes || ''}`
  }, [sel])

  // Filter alarms
  const shown = useMemo(() => {
    if (filter === 'all') return alarms
    if (filter === 'resolved') return alarms.filter(a => a.resolvedAt)
    return alarms.filter(a => a.severity === filter && !a.resolvedAt)
  }, [alarms, filter])

  // Counts per severity
  const counts = useMemo(() => ({
    CRITICAL: alarms.filter(a => a.severity === 'CRITICAL' && !a.resolvedAt).length,
    ALERT: alarms.filter(a => a.severity === 'ALERT' && !a.resolvedAt).length,
    WARNING: alarms.filter(a => a.severity === 'WARNING' && !a.resolvedAt).length,
    resolved: alarms.filter(a => a.resolvedAt).length,
  }), [alarms])

  // Sensor data rows cho bảng chi tiết (dùng real alarm data)
  const sensorRows = useMemo(() => {
    if (!sel) return []
    // Lấy tối đa 4 alarm gần nhất cùng sensorType
    const related = alarms
      .filter(a => a.sensorType === sel.sensorType)
      .slice(0, 4)
      .reverse()

    return related.map(a => ({
      t: formatTime(a.triggeredAt),
      val: a.measuredVal,
      threshold: a.thresholdVal,
      severity: a.severity,
      unit: SENSOR_TYPE_UNITS[a.sensorType] || '',
    }))
  }, [sel, alarms])

  const handleSend = () => { setSent(true); setTimeout(() => setSent(false), 3000) }

  // Loading state
  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-48px)]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <div className="text-[11px] text-muted">Đang tải dữ liệu cảnh báo...</div>
      </div>
    </div>
  )

  return (
    <>
    <div className="grid gap-3 p-4 h-[calc(100vh-48px)] overflow-hidden"
      style={{ gridTemplateColumns: '260px 1fr 285px' }}>

      {/* LEFT: Alert list */}
      <div className="overflow-y-auto">
        <div className="flex justify-between items-center mb-2.5">
          <Label className="mb-0">Cảnh báo gần đây</Label>
          <Mono className="text-[9px] text-danger bg-danger-soft px-1.5 py-0.5 rounded-sm">
            {unresolvedCount} CHƯA XỬ LÝ
          </Mono>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 mb-2.5 flex-wrap">
          {[
            ['all', 'Tất cả'],
            ['CRITICAL', `Nguy cấp (${counts.CRITICAL})`],
            ['ALERT', `Báo động (${counts.ALERT})`],
            ['WARNING', `Cảnh báo (${counts.WARNING})`],
            ['resolved', `Đã xử lý (${counts.resolved})`],
          ].map(([id, lb]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors
                ${filter === id ? 'bg-accent-soft border-accent-soft text-accent' : 'bg-transparent border-border text-muted hover:text-tx'}`}>
              {lb}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-warning/10 border border-warning/30 rounded px-2.5 py-2 mb-2.5 text-[10px] text-warning">
            ⚠️ {error}
          </div>
        )}

        {/* Alarm list */}
        <div className="flex flex-col gap-1.5">
          {shown.length === 0 && (
            <div className="text-center py-8 text-[11px] text-muted">
              {error ? 'Không thể kết nối backend' : 'Không có cảnh báo nào'}
            </div>
          )}
          {shown.map(al => {
            const s = getStatusBySeverity(al.severity)
            const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
            const isSel = sel?.id === al.id
            const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType

            return (
              <div key={al.id} onClick={() => setSelId(al.id)}
                className={`border-l-[3px] ${s.leftBorder} rounded px-2.5 py-2 cursor-pointer transition-all
                  ${isSel ? `${s.bg} ${s.border} border` : 'bg-card border border-border'}
                  ${al.resolvedAt ? 'opacity-60' : ''}`}>
                <div className="flex justify-between mb-1">
                  <Mono className={`text-[8px] uppercase ${s.text}`}>
                    {sevInfo.icon} {sevInfo.label}
                  </Mono>
                  <Mono className="text-[8px] text-muted">{timeAgo(al.triggeredAt)} TRƯỚC</Mono>
                </div>
                <div className="text-[11px] font-semibold text-tx mb-1">
                  {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                </div>
                <div className="text-[9px] text-muted line-clamp-2">{al.notes}</div>
                {al.resolvedAt && (
                  <Mono className="text-[8px] text-safe mt-1">✅ Đã xử lý</Mono>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* CENTER: Detail */}
      {sel && (() => {
        const s = getStatusBySeverity(sel.severity)
        const sevInfo = SEVERITY_MAP[sel.severity] || SEVERITY_MAP.WARNING
        const typeLb = SENSOR_TYPE_LABELS[sel.sensorType] || sel.sensorType
        const unit = SENSOR_TYPE_UNITS[sel.sensorType] || ''
        const triggeredDate = sel.triggeredAt ? new Date(sel.triggeredAt) : null

        return (
          <div className="overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-bold text-tx m-0">{typeLb} vượt ngưỡng</h2>
                  <span className={`font-mono text-[9px] font-bold ${s.text} ${s.bg} ${s.border} border px-2 py-0.5 rounded-sm`}>
                    {sevInfo.icon} {sevInfo.label}
                  </span>
                  {sel.resolvedAt && (
                    <span className="font-mono text-[9px] font-bold text-safe bg-safe-soft border border-safe-soft px-2 py-0.5 rounded-sm">
                      ✅ ĐÃ XỬ LÝ
                    </span>
                  )}
                </div>
                <Mono className="text-[9px] text-muted">
                  📅 {triggeredDate?.toLocaleDateString('vi-VN')}  ⏰ {triggeredDate?.toLocaleTimeString('vi-VN')}  🆔 {sel.sensorId}
                </Mono>
              </div>
              <div className="flex gap-1.5">
                {!sel.resolvedAt && (
                  <button onClick={() => resolveAlarm(sel.id)}
                    className="px-2.5 py-1 border border-safe/40 rounded bg-safe/10 text-safe text-[10px] font-bold cursor-pointer hover:bg-safe/20 transition-colors">
                    ✅ Đánh dấu đã xử lý
                  </button>
                )}
                <button className="px-2.5 py-1 border border-border rounded bg-transparent text-tx text-[10px] cursor-pointer hover:bg-white/5">
                  🖨 PDF
                </button>
              </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-2.5 mb-3" style={{ gridTemplateColumns: '1.3fr 1fr 1fr' }}>
              {/* Camera AI */}
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <Mono className="text-[9px] text-tx">Camera AI — {sel.sensorId}</Mono>
                  <Mono className={`text-[7px] ${sel.cameraActivated ? 'text-safe' : 'text-muted'}`}>
                    {sel.cameraActivated ? '● ACTIVE' : '○ STANDBY'}
                  </Mono>
                </div>
                <div className={`bg-card2 rounded ${sel.imageUrl ? 'h-48' : 'h-20'} overflow-hidden flex items-center justify-center relative mb-2`}>
                  {sel.imageUrl ? (
                    <img src={sel.imageUrl} alt="AI Camera Capture" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">📷</span>
                  )}
                  {sel.cameraActivated && (
                    <div className="absolute top-1.5 left-1.5 font-mono text-[7px] text-danger bg-danger-soft border border-danger-soft px-1.5 py-0.5 rounded">
                      {sel.crackDetected === null || sel.crackDetected === undefined ? (
                        'ĐANG PHÂN TÍCH...'
                      ) : sel.crackDetected ? (
                        `NỨT VỠ (${((sel.crackConfidence || 0) * 100).toFixed(0)}%)`
                      ) : (
                        'AN TOÀN (0%)'
                      )}
                    </div>
                  )}
                  <Mono className="absolute bottom-1 left-1.5 text-[7px] text-muted bg-black/60 px-1 rounded-sm">
                    {triggeredDate?.toLocaleTimeString('vi-VN')} | {sel.damId}
                  </Mono>
                  {sel.imageUrl && (
                    <button onClick={() => setFullImg(true)}
                      className="absolute bottom-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 border border-white/20 text-white text-[10px] cursor-pointer transition-all hover:scale-110"
                      title="Xem ảnh đầy đủ">
                      ⛶
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-tx leading-relaxed">{sel.notes}</p>
              </div>

              {/* Giá trị đo */}
              <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-center">
                <div className="text-[8px] text-muted uppercase tracking-wider mb-2">Giá trị đo</div>
                <Mono className={`text-2xl font-bold ${s.text}`}>{sel.measuredVal} {unit}</Mono>
                <p className={`text-[8px] ${s.text} mt-1.5`}>Ngưỡng: {sel.thresholdVal} {unit}</p>
                <div className="h-1 bg-border rounded-full mt-2">
                  <div className={`h-full rounded-full ${sel.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning'} opacity-70`}
                    style={{ width: `${Math.min((sel.measuredVal / (sel.thresholdVal * 1.5)) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Duration / Thông tin thêm */}
              <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-center">
                <div className="text-[8px] text-muted uppercase tracking-wider mb-2">Thời gian vượt ngưỡng</div>
                <Mono className={`text-2xl font-bold ${s.text}`}>
                  {sel.durationS > 0 ? `${sel.durationS}s` : 'Tức thì'}
                </Mono>
                <p className="text-[8px] text-muted mt-1.5">
                  Loại: {typeLb}
                </p>
                <div className="mt-2 flex gap-1.5">
                  {sel.cameraActivated && (
                    <span className="text-[7px] font-mono text-info bg-info-soft border border-info-soft px-1.5 py-0.5 rounded">📸 CAM</span>
                  )}
                  {sel.crackDetected && (
                    <span className="text-[7px] font-mono text-danger bg-danger-soft border border-danger-soft px-1.5 py-0.5 rounded">⚠️ NỨT</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sensor table — Lịch sử cảnh báo cùng loại */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border">
                <span className="text-[12px] font-semibold text-tx">Lịch sử cảnh báo — {typeLb}</span>
                <Mono className="text-[9px] text-muted">{sensorRows.length} bản ghi</Mono>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-card2">
                    {['THỜI GIAN', 'GIÁ TRỊ ĐO', 'NGƯỠNG', 'MỨC CẢNH BÁO'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[8px] text-muted font-bold uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensorRows.map((r, i) => {
                    const rs = getStatusBySeverity(r.severity)
                    const ri = SEVERITY_MAP[r.severity] || SEVERITY_MAP.WARNING
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2"><Mono className="text-[9px] text-muted">{r.t}</Mono></td>
                        <td className="px-3 py-2"><Mono className={`text-[13px] font-bold ${rs.text}`}>{r.val} {r.unit}</Mono></td>
                        <td className="px-3 py-2"><Mono className="text-[12px] text-tx">{r.threshold} {r.unit}</Mono></td>
                        <td className="px-3 py-2">
                          <span className={`inline-block font-mono text-[9px] font-bold tracking-widest border rounded-[3px] px-1.5 py-0.5 ${rs.text} ${rs.bg} ${rs.border}`}>
                            {ri.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {sensorRows.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-4 text-center text-[10px] text-muted">Chưa có dữ liệu</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

      {/* No selection placeholder */}
      {!sel && (
        <div className="flex items-center justify-center">
          <div className="text-center text-muted">
            <div className="text-3xl mb-2">🔔</div>
            <div className="text-[12px]">Chưa có cảnh báo nào</div>
            <div className="text-[10px] mt-1">Hệ thống sẽ tự động hiển thị khi phát hiện bất thường</div>
          </div>
        </div>
      )}

      {/* RIGHT: Dispatch */}
      <div className="overflow-y-auto">
        <div className="bg-card border border-border rounded-lg p-3 mb-2.5">
          <Mono className="text-[8px] text-muted tracking-widest block mb-1">ĐIỀU PHỐI</Mono>
          <div className="text-[13px] font-bold text-tx mb-3">TRUNG TÂM CHỈ HUY KHẨN CẤP</div>
          <button className="w-full py-2 mb-2 rounded-md text-white text-[11px] font-bold tracking-wide border-none cursor-pointer bg-gradient-to-r from-red-600 to-red-500">
            🔔 KÍCH HOẠT CÒI BÁO ĐỘNG
          </button>
          <button className="w-full py-2 rounded border border-border bg-transparent text-tx text-[11px] font-bold tracking-wide cursor-pointer hover:bg-white/5">
            🛡 PHÊ DUYỆT SOP — P-03
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-3">
          <div className="text-[12px] font-bold text-tx mb-3">GỬI THÔNG BÁO KHẨN CẤP</div>

          <div className="mb-2.5">
            <Label className="mb-1.5">Người nhận</Label>
            <select className="w-full bg-card2 border border-border rounded px-2 py-1.5 text-tx text-[11px] outline-none">
              <option>Ban chỉ huy PCTT (Toàn bộ)</option>
              <option>PCTT Huyện Đan Phượng</option>
              <option>PCTT Tỉnh Hà Nội</option>
            </select>
          </div>

          <div className="mb-2.5">
            <Label className="mb-1.5">Phương thức liên lạc</Label>
            <div className="flex gap-1.5">
              {[['sms', 'SMS'], ['zalo', 'Zalo'], ['email', 'Email']].map(([k, lb]) => (
                <button key={k} onClick={() => setModes(p => ({ ...p, [k]: !p[k] }))}
                  className={`flex-1 py-1.5 rounded border text-[10px] font-semibold cursor-pointer transition-colors
                    ${modes[k] ? 'bg-accent-soft border-accent text-accent' : 'bg-transparent border-border text-muted hover:text-tx'}`}>
                  {lb}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2.5">
            <div className="flex justify-between mb-1.5">
              <Label className="mb-0">Nội dung cảnh báo</Label>
              <span className="text-[9px] text-accent cursor-pointer font-semibold hover:underline"
                onClick={() => setMsg(defaultMsg)}>
                Mẫu soạn sẵn
              </span>
            </div>
            <textarea value={msg || defaultMsg} onChange={e => setMsg(e.target.value)} rows={4}
              className="w-full bg-card2 border border-border rounded px-2.5 py-2 text-tx text-[10px] outline-none resize-none leading-relaxed" />
            <Mono className="text-[8px] text-muted">{(msg || defaultMsg).length}/500 ký tự</Mono>
          </div>

          <button onClick={handleSend}
            className={`w-full py-2 rounded-md border-none text-white text-[11px] font-bold tracking-wide cursor-pointer transition-all
              ${sent ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
            {sent ? '✅ ĐÃ GỬI THÀNH CÔNG' : '📤 GỬI THÔNG BÁO KHẨN CẤP'}
          </button>

          <Divider />

          {/* Nhật ký — từ alarm events gần nhất */}
          <div className="text-[11px] font-bold text-tx mb-2">Nhật ký hoạt động</div>
          {alarms.slice(0, 5).map((al, i) => {
            const sevInfo = SEVERITY_MAP[al.severity] || SEVERITY_MAP.WARNING
            const typeLb = SENSOR_TYPE_LABELS[al.sensorType] || al.sensorType
            const dotCl = al.resolvedAt ? 'bg-safe' : al.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning'
            return (
              <div key={al.id || i} className="flex gap-2 mb-2.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dotCl} mt-1.5 shrink-0`} />
                <div>
                  <div className="text-[10px] text-tx">
                    {al.resolvedAt ? '✅ Đã xử lý: ' : `${sevInfo.icon} `}
                    {typeLb} — {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                  </div>
                  <Mono className="text-[8px] text-muted">
                    {timeAgo(al.triggeredAt)} TRƯỚC — {al.resolvedAt ? 'Admin' : 'Hệ thống'}
                  </Mono>
                </div>
              </div>
            )
          })}
          {alarms.length === 0 && (
            <div className="text-[10px] text-muted text-center py-2">Chưa có hoạt động</div>
          )}
        </div>
      </div>
    </div>

    {/* Fullscreen image modal */}
    {fullImg && sel?.imageUrl && (
      <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onClick={() => setFullImg(false)}>
        <button onClick={() => setFullImg(false)}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[14px] cursor-pointer transition-colors z-10">
          ✕
        </button>
        <img src={sel.imageUrl} alt="AI Camera Capture — Full" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()} />
      </div>
    )}
  </>
  )
}
