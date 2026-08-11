'use client'

import { useState, useMemo } from 'react'
import { useAlarmData } from '@/hooks/useAlarmData'
import { useDamData } from '@/hooks/useDamData'
import { sendEmailAlert, getFormattedImageUrl } from '@/lib/api'
import { getStatusBySeverity } from '@/lib/statusConfig'
import { SEVERITY_MAP, SENSOR_TYPE_LABELS, SENSOR_TYPE_UNITS, timeAgo, formatTime } from '@/lib/sensorHelpers'
import { Mono, Badge, Divider, Label } from '@/components/ui'
import { AlertTriangle, Check, CheckCircle2, Printer, Video, Maximize2, Camera, Bell, Shield, Send, X, Calendar, Clock, Fingerprint, MapPin, Database, Radio } from 'lucide-react'

export default function AlertsPage() {
  const { alarms, thresholds, loading, error, resolveAlarm, unresolvedCount } = useAlarmData()
  const { dams, stations } = useDamData()

  const [selId, setSelId] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'CRITICAL' | 'ALERT' | 'WARNING' | 'resolved'
  const [modes, setModes] = useState({ sms: false, zalo: false, email: true })
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [fullImg, setFullImg] = useState(false)

  // Quản lý danh sách Email người nhận thực tế do Admin chủ động tạo
  const [emailList, setEmailList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin_email_recipients')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch (e) { }
      }
    }
    return ['ruka13312002@gmail.com']
  })
  const [newEmailInput, setNewEmailInput] = useState('')

  // Helper tra cứu vị trí Trạm & Đập
  const getLocationInfo = (alarm) => {
    if (!alarm) return { damName: 'Đập Thủy Điện', damLocation: 'Hà Nội', stationName: 'Trạm Quan Trắc', stationLoc: 'K25+500', river: '', km: '', fullLocation: '' }

    const dam = dams.find(d => d.id === alarm.damId) || dams[0]
    const damName = dam?.name || `Đập ${alarm.damId || 'Thủy Điện'}`
    const damLocation = dam?.location || 'Việt Nam'

    // Lookup station
    const station = stations.find(s => String(s.id) === String(alarm.sensorId) || s.damId === alarm.damId) || stations[0]
    const stationName = station?.name || `Trạm ${alarm.sensorId || 'Quan Trắc'}`
    const stationLoc = station?.location || 'Thân đập chính'
    const river = station?.river || 'Sông Hồng'
    const km = station?.km || 'K25+500'

    const fullLocation = `${stationName} (${stationLoc} — ${river} ${km}) thuộc ${damName} (${damLocation})`

    return { damName, damLocation, stationName, stationLoc, river, km, fullLocation }
  }

  const addEmailContact = () => {
    const trimmed = newEmailInput.trim().toLowerCase()
    if (!trimmed) return
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      alert('Vui lòng nhập định dạng Email hợp lệ!')
      return
    }
    if (emailList.includes(trimmed)) {
      alert('Email này đã tồn tại trong danh sách!')
      return
    }
    const updated = [...emailList, trimmed]
    setEmailList(updated)
    setNewEmailInput('')
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_email_recipients', JSON.stringify(updated))
    }
  }

  const removeEmailContact = (emailToRemove) => {
    const updated = emailList.filter(e => e !== emailToRemove)
    setEmailList(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_email_recipients', JSON.stringify(updated))
    }
  }

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
    const locInfo = getLocationInfo(sel)
    return `[${sevInfo.label}] Cảnh báo ${typeLb} tại vị trí: ${locInfo.fullLocation}. Giá trị đo: ${sel.measuredVal} ${unit} (Ngưỡng: ${sel.thresholdVal} ${unit}). ${sel.notes || ''}`
  }, [sel, dams, stations])

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

  const handleSend = async () => {
    if (sending) return
    setSending(true)
    setStatusMsg('')
    try {
      const recipientsToSend = emailList.length > 0 ? emailList : ['ruka13312002@gmail.com']
      const data = await sendEmailAlert({
        toEmail: recipientsToSend,
        message: msg || defaultMsg,
        alarmId: sel?.id,
      })
      if (data.success) {
        setSent(true)
        setStatusMsg(data.message || 'Đã gửi Email cảnh báo thành công!')
        setTimeout(() => {
          setSent(false)
          setStatusMsg('')
        }, 5000)
      } else {
        setStatusMsg(data.message || 'Gửi email thất bại')
      }
    } catch (err) {
      console.error('[AlertsPage] Lỗi gửi email:', err)
      setStatusMsg('Lỗi kết nối tới Backend server')
    } finally {
      setSending(false)
    }
  }


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
            <div className="bg-warning/10 border border-warning/30 rounded px-2.5 py-2 mb-2.5 text-[10px] text-warning flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
              <span>{error}</span>
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
              const loc = getLocationInfo(al)

              return (
                <div key={al.id} onClick={() => setSelId(al.id)}
                  className={`border-l-[3px] ${s.leftBorder} rounded-lg p-2.5 cursor-pointer transition-all
                  ${isSel ? `${s.bg} ${s.border} border` : 'bg-card border border-border hover:bg-white/5'}
                  ${al.resolvedAt ? 'opacity-60' : ''}`}>
                  <div className="flex justify-between mb-1">
                    <Mono className={`text-[10px] uppercase font-bold ${s.text} flex items-center gap-1`}>
                      {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                      <span>{sevInfo.label}</span>
                    </Mono>
                    <Mono className="text-[10px] text-muted">{timeAgo(al.triggeredAt)} TRƯỚC</Mono>
                  </div>

                  <div className="text-[12px] font-bold text-tx mb-1">
                    {typeLb}: {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                  </div>

                  {/* Vị trí Trạm & Đập */}
                  <div className="text-[10px] text-muted space-y-0.5 my-1 bg-card2 p-1.5 rounded border border-border/40">
                    <div className="flex items-center gap-1 text-tx font-medium">
                      <Radio className="w-3 h-3 text-sky-400 shrink-0" />
                      <span>{loc.stationName} ({loc.stationLoc})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted">
                      <Database className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>{loc.damName} ({loc.damLocation})</span>
                    </div>
                  </div>

                  <div className="text-[10px] text-muted line-clamp-2">{al.notes}</div>
                  {al.resolvedAt && (
                    <Mono className="text-[9px] text-safe mt-1 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>Đã xử lý</span>
                    </Mono>
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
          const loc = getLocationInfo(sel)

          return (
            <div className="overflow-y-auto space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start bg-card border border-border rounded-xl p-4 shadow-md">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-xl font-bold text-tx m-0">{typeLb} vượt ngưỡng</h2>
                    <span className={`font-mono text-[11px] font-bold ${s.text} ${s.bg} ${s.border} border px-2.5 py-0.5 rounded flex items-center gap-1`}>
                      {sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0" />}
                      <span>{sevInfo.label}</span>
                    </span>
                    {sel.resolvedAt && (
                      <span className="font-mono text-[11px] font-bold text-safe bg-safe-soft border border-safe-soft px-2.5 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>ĐÃ XỬ LÝ</span>
                      </span>
                    )}
                  </div>
                  <Mono className="text-[11px] text-muted flex items-center gap-3">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-muted shrink-0" /> {triggeredDate?.toLocaleDateString('vi-VN')}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-muted shrink-0" /> {triggeredDate?.toLocaleTimeString('vi-VN')}</span>
                    <span className="flex items-center gap-1"><Fingerprint className="w-3.5 h-3.5 text-muted shrink-0" /> ID: {sel.id || sel.sensorId}</span>
                  </Mono>
                </div>
                <div className="flex gap-2">
                  {!sel.resolvedAt && (
                    <button onClick={() => resolveAlarm(sel.id)}
                      className="px-3 py-1.5 border border-safe/40 rounded-lg bg-safe/10 text-safe text-[11px] font-bold cursor-pointer hover:bg-safe/20 transition-colors flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Đánh dấu đã xử lý</span>
                    </button>
                  )}
                  <button className="px-3 py-1.5 border border-border rounded-lg bg-card2 text-tx text-[11px] font-semibold cursor-pointer hover:bg-white/5 flex items-center gap-1">
                    <Printer className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              {/* DEDICATED LOCATION CARD */}
              <div className="bg-card2 border border-border rounded-xl p-4 shadow-md space-y-2">
                <div className="text-[11px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent shrink-0" />
                  <span>VỊ TRÍ XẢY RA CẢNH BÁO</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Đập thủy điện */}
                  <div className="bg-card border border-border rounded-lg p-3 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted uppercase font-semibold">Đập Thủy Điện</div>
                      <div className="text-[13px] font-bold text-tx">{loc.damName}</div>
                      <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted shrink-0" />
                        <span>Vị trí đập: <strong>{loc.damLocation}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Trạm quan trắc */}
                  <div className="bg-card border border-border rounded-lg p-3 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted uppercase font-semibold">Trạm Quan Trắc</div>
                      <div className="text-[13px] font-bold text-tx">{loc.stationName}</div>
                      <div className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted shrink-0" />
                        <span>Vị trí: <strong>{loc.stationLoc}</strong> ({loc.river} — <Mono className="text-tx">{loc.km}</Mono>)</span>
                      </div>
                    </div>
                  </div>
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
                      <img src={getFormattedImageUrl(sel.imageUrl)} alt="AI Camera Capture" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-muted opacity-30 shrink-0" />
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
                        className="absolute bottom-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded bg-black/60 hover:bg-black/80 border border-white/20 text-white cursor-pointer transition-all hover:scale-110"
                        title="Xem ảnh đầy đủ">
                        <Maximize2 className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-tx leading-relaxed">{sel.notes}</p>
                </div>

                {/* Giá trị đo */}
                <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-center">
                  <div className="text-[15px] text-white uppercase tracking-wider mb-2">Giá trị đo</div>
                  <Mono className={`text-2xl font-bold ${s.text}`}>{sel.measuredVal} {unit}</Mono>
                  <p className={`text-[12px] ${s.text} mt-1.5`}>Ngưỡng: {sel.thresholdVal} {unit}</p>
                  <div className="h-1 bg-border rounded-full mt-2">
                    <div className={`h-full rounded-full ${sel.severity === 'CRITICAL' ? 'bg-danger' : 'bg-warning'} opacity-70`}
                      style={{ width: `${Math.min((sel.measuredVal / (sel.thresholdVal * 1.5)) * 100, 100)}%` }} />
                  </div>
                </div>

                {/* Duration / Thông tin thêm */}
                <div className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-center">
                  <div className="text-[15px] text-white uppercase tracking-wider mb-2">Thời gian vượt ngưỡng</div>
                  <Mono className={`text-2xl font-bold ${s.text}`}>
                    {sel.durationS > 0 ? `${sel.durationS}s` : 'Tức thì'}
                  </Mono>
                  <p className="text-[12px] text-white font-bold mt-1.5">
                    Loại: {typeLb}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    {sel.cameraActivated && (
                      <span className="text-[12px] font-mono text-info bg-info-soft border border-info-soft px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Camera className="w-3 h-3" />
                        <span>CAM</span>
                      </span>
                    )}
                    {sel.crackDetected && (
                      <span className="text-[12px] font-mono text-danger bg-danger-soft border border-danger-soft px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        <span>NỨT</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sensor table — Lịch sử cảnh báo cùng loại */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border">
                  <span className="text-[12px] font-semibold text-tx">Lịch sử cảnh báo — {typeLb}</span>
                  <Mono className="text-[12px] text-white">{sensorRows.length} bản ghi</Mono>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-card2">
                      {['THỜI GIAN', 'GIÁ TRỊ ĐO', 'NGƯỠNG', 'MỨC CẢNH BÁO'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[12px] text-white font-bold uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensorRows.map((r, i) => {
                      const rs = getStatusBySeverity(r.severity)
                      const ri = SEVERITY_MAP[r.severity] || SEVERITY_MAP.WARNING
                      return (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2"><Mono className="text-[12px] text-white">{r.t}</Mono></td>
                          <td className="px-3 py-2"><Mono className={`text-[13px] font-bold ${rs.text}`}>{r.val} {r.unit}</Mono></td>
                          <td className="px-3 py-2"><Mono className="text-[12px] text-tx">{r.threshold} {r.unit}</Mono></td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-bold tracking-widest border rounded-[3px] px-1.5 py-0.5 ${rs.text} ${rs.bg} ${rs.border}`}>
                              {ri.icon && <ri.icon className="w-2.5 h-2.5 shrink-0" />}
                              <span>{ri.label}</span>
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
            <div className="text-center text-muted flex flex-col items-center">
              <Bell className="w-8 h-8 mb-2 opacity-30 text-muted shrink-0" />
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
            <button className="w-full py-2 mb-2 rounded-md text-white text-[11px] font-bold tracking-wide border-none cursor-pointer bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center gap-1.5">
              <Bell className="w-3.5 h-3.5 animate-bounce shrink-0" />
              <span>KÍCH HOẠT CÒI BÁO ĐỘNG</span>
            </button>
            <button className="w-full py-2 rounded border border-border bg-transparent text-tx text-[11px] font-bold tracking-wide cursor-pointer hover:bg-white/5 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>PHÊ DUYỆT SOP — P-03</span>
            </button>
          </div>

          <div className="bg-card border border-border rounded-lg p-3">
            <div className="text-[12px] font-bold text-tx mb-3">GỬI THÔNG BÁO KHẨN CẤP</div>

            <div className="mb-3">
              <div className="flex justify-between items-center mb-1.5">
                <Label className="mb-0">Danh sách Email nhận thông báo ({emailList.length})</Label>
              </div>

              {/* Danh sách Email dạng thẻ (Badges) do Admin quản lý */}
              <div className="flex flex-wrap gap-1.5 mb-2 max-h-28 overflow-y-auto bg-card2 border border-border p-2 rounded">
                {emailList.map(email => (
                  <span key={email} className="inline-flex items-center gap-1 bg-accent-soft border border-accent/40 text-accent font-mono text-[9px] px-2 py-0.5 rounded-full">
                    <span>{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmailContact(email)}
                      className="hover:text-red-400 cursor-pointer ml-1 font-bold text-[11px] border-none bg-transparent text-accent/70"
                      title="Xóa Email này"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {emailList.length === 0 && (
                  <span className="text-[9px] text-muted p-1">Danh sách trống. Hãy thêm Email thật của Admin bên dưới.</span>
                )}
              </div>

              {/* Form Admin tự thêm Email thật mới */}
              <div className="flex gap-1.5">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={e => setNewEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmailContact())}
                  placeholder="Thêm Email người nhận mới..."
                  className="flex-1 bg-card2 border border-border rounded px-2.5 py-1 text-tx text-[10px] outline-none"
                />
                <button
                  type="button"
                  onClick={addEmailContact}
                  className="px-2.5 py-1 bg-accent/20 hover:bg-accent/30 border border-accent/40 text-accent rounded text-[10px] font-bold cursor-pointer transition-colors shrink-0"
                >
                  + Thêm Email
                </button>
              </div>
            </div>

            <div className="mb-2.5">
              <Label className="mb-1.5">Phương thức liên lạc</Label>
              <div className="flex gap-1.5">
                {[['sms', 'SMS'], ['zalo', 'Zalo'], ['email', 'Email (Mặc định)']].map(([k, lb]) => (
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

            {statusMsg && (
              <div className={`p-2 rounded text-[10px] font-semibold mb-2.5 ${sent ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                {statusMsg}
              </div>
            )}

            <button onClick={handleSend} disabled={sending}
              className={`w-full py-2 rounded-md border-none text-white text-[11px] font-bold tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5
              ${sent ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-red-500'} ${sending ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>ĐANG GỬI EMAIL...</span>
                </>
              ) : sent ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>ĐÃ GỬI THÀNH CÔNG</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 shrink-0" />
                  <span>GỬI THÔNG BÁO KHẨN CẤP</span>
                </>
              )}
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
                    <div className="text-[10px] text-tx flex items-center gap-1">
                      {al.resolvedAt ? (
                        <CheckCircle2 className="w-3 h-3 text-safe shrink-0" />
                      ) : (
                        sevInfo.icon && <sevInfo.icon className="w-3 h-3 shrink-0 text-current" />
                      )}
                      <span>
                        {al.resolvedAt ? 'Đã xử lý: ' : ''}
                        {typeLb} — {al.measuredVal} {SENSOR_TYPE_UNITS[al.sensorType] || ''}
                      </span>
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
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
          <img src={getFormattedImageUrl(sel.imageUrl)} alt="AI Camera Capture — Full" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  )
}
