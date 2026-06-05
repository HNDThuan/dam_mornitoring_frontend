'use client'

import { useState } from 'react'
import { ALERTS_DATA } from '@/lib/mockData'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'

export default function AlertsPage() {
  const [sel, setSel]   = useState(ALERTS_DATA[0])
  const [filter, setFilter] = useState('all')
  const [modes, setModes]  = useState({ sms: true, zalo: true, email: false })
  const [msg, setMsg]   = useState('[KHẨN CẤP] Cảnh báo vỡ đê tại K25+500, Huyện Đan Phượng. Mực nước hiện tại 12.5m (Vượt Báo động 3). Yêu cầu Ban chỉ huy PCTT kích hoạt phương án di dời dân cư NGAY LẬP TỨC.')
  const [sent, setSent] = useState(false)

  const shown = filter === 'all' ? ALERTS_DATA : ALERTS_DATA.filter(a => a.level === filter)
  const handleSend = () => { setSent(true); setTimeout(() => setSent(false), 3000) }

  const sensorRows = sel ? [
    { t: '10:30', lv: (sel.waterLevel - .25).toFixed(2), r: Math.max(0, sel.rainfall - 7.1).toFixed(1), st: 'warning' },
    { t: '10:35', lv: (sel.waterLevel - .2).toFixed(2),  r: Math.max(0, sel.rainfall - 4.5).toFixed(1), st: 'warning' },
    { t: '10:40', lv: (sel.waterLevel - .1).toFixed(2),  r: Math.max(0, sel.rainfall - 2.7).toFixed(1), st: 'danger'  },
    { t: '10:45', lv: sel.waterLevel.toFixed(2),          r: sel.rainfall.toFixed(1),                    st: 'danger'  },
  ] : []

  return (
    <div className="grid gap-3 p-4 h-[calc(100vh-48px)] overflow-hidden"
      style={{ gridTemplateColumns: '260px 1fr 285px' }}>

      {/* LEFT: Alert list */}
      <div className="overflow-y-auto">
        <div className="flex justify-between items-center mb-2.5">
          <Label className="mb-0">Cảnh báo gần đây</Label>
          <Mono className="text-[9px] text-danger bg-danger-soft px-1.5 py-0.5 rounded-sm">{ALERTS_DATA.length} TỔNG</Mono>
        </div>

        <div className="flex gap-1 mb-2.5">
          {[['all', 'Tất cả'], ['danger', `Nguy cấp (${ALERTS_DATA.filter(a => a.level === 'danger').length})`], ['warning', 'Khẩn cấp']].map(([id, lb]) => (
            <button key={id} onClick={() => setFilter(id)}
              className={`px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors
                ${filter === id ? 'bg-accent-soft border-accent-soft text-accent' : 'bg-transparent border-border text-muted hover:text-tx'}`}>
              {lb}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {shown.map(al => {
            const s = getStatus(al.level)
            const isSel = sel?.id === al.id
            return (
              <div key={al.id} onClick={() => setSel(al)}
                className={`border-l-[3px] ${s.leftBorder} rounded px-2.5 py-2 cursor-pointer transition-all
                  ${isSel ? `${s.bg} ${s.border} border` : 'bg-card border border-border'}`}>
                <div className="flex justify-between mb-1">
                  <Mono className={`text-[8px] uppercase ${s.text}`}>{s.label}</Mono>
                  <Mono className="text-[8px] text-muted">{al.time}</Mono>
                </div>
                <div className="text-[11px] font-semibold text-tx mb-1">{al.title}</div>
                <div className="text-[9px] text-muted line-clamp-2">{al.desc}</div>
                <div className="text-[8px] text-muted mt-1">📍 {al.location}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CENTER: Detail */}
      {sel && (() => {
        const s = getStatus(sel.level)
        return (
          <div className="overflow-y-auto">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-bold text-tx m-0">{sel.title}</h2>
                  <span className={`font-mono text-[9px] font-bold ${s.text} ${s.bg} ${s.border} border px-2 py-0.5 rounded-sm`}>
                    MỨC {sel.level === 'danger' ? '3' : '2'} — {s.label}
                  </span>
                </div>
                <Mono className="text-[9px] text-muted">📅 {sel.date}  ⏰ {sel.time}  📍 {sel.river}, {sel.location}</Mono>
              </div>
              <div className="flex gap-1.5">
                {['🖨 PDF', '↗ Chia sẻ'].map(lb => (
                  <button key={lb} className="px-2.5 py-1 border border-border rounded bg-transparent text-tx text-[10px] cursor-pointer hover:bg-white/5">{lb}</button>
                ))}
              </div>
            </div>

            {/* Camera + metrics */}
            <div className="grid gap-2.5 mb-3" style={{ gridTemplateColumns: '1.3fr 1fr 1fr' }}>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <Mono className="text-[9px] text-tx">Camera AI — CAM-DP-03</Mono>
                  <Mono className="text-[7px] text-safe">● LIVE</Mono>
                </div>
                <div className="bg-card2 rounded h-20 flex items-center justify-center relative mb-2">
                  <span className="text-2xl">📷</span>
                  <div className="absolute top-1.5 left-1.5 font-mono text-[7px] text-danger bg-danger-soft border border-danger-soft px-1.5 py-0.5 rounded">TRÀN NƯỚC (98%)</div>
                  <Mono className="absolute bottom-1 left-1.5 text-[7px] text-muted">10:45:32 AM | FPS: 30</Mono>
                </div>
                <p className="text-[9px] text-tx leading-relaxed">Dòng chảy tràn 2.5 m/s. Nguy cơ xói mòn cục bộ.</p>
              </div>
              {[
                { lb: 'Mực nước',         val: sel.waterLevel + 'm', sub: 'Vượt BĐ3 +0.5m',    cl: 'text-danger' },
                { lb: 'Áp lực thẩm thấu', val: sel.pressure + ' kPa', sub: 'Giới hạn: 300 kPa', cl: sel.pressure > 350 ? 'text-danger' : 'text-warning' },
              ].map(({ lb, val, sub, cl }) => (
                <div key={lb} className="bg-card border border-border rounded-lg p-3.5 flex flex-col justify-center">
                  <div className="text-[8px] text-muted uppercase tracking-wider mb-2">{lb}</div>
                  <Mono className={`text-2xl font-bold ${cl}`}>{val}</Mono>
                  <p className={`text-[8px] ${cl} mt-1.5`}>{sub}</p>
                  <div className="h-1 bg-border rounded-full mt-2">
                    <div className={`h-full rounded-full w-4/5 ${cl === 'text-danger' ? 'bg-danger' : 'bg-warning'} opacity-70`} />
                  </div>
                </div>
              ))}
            </div>

            {/* Sensor table */}
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border">
                <span className="text-[12px] font-semibold text-tx">Dữ liệu cảm biến thời gian thực</span>
                <button className="text-accent text-[10px] font-bold bg-transparent border-none cursor-pointer hover:underline">Xem đầy đủ</button>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-card2">
                    {['THỜI GIAN', 'MỰC NƯỚC (M)', 'LƯỢNG MƯA', 'TRẠNG THÁI'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-[8px] text-muted font-bold uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sensorRows.map((r, i) => {
                    const rs = getStatus(r.st)
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2"><Mono className="text-[9px] text-muted">{r.t} AM</Mono></td>
                        <td className="px-3 py-2"><Mono className={`text-[13px] font-bold ${rs.text}`}>{r.lv}</Mono></td>
                        <td className="px-3 py-2"><Mono className="text-[12px] text-tx">{r.r} mm</Mono></td>
                        <td className="px-3 py-2"><Badge status={r.st} sm /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}

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
              <span className="text-[9px] text-accent cursor-pointer font-semibold hover:underline">Mẫu soạn sẵn</span>
            </div>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={4}
              className="w-full bg-card2 border border-border rounded px-2.5 py-2 text-tx text-[10px] outline-none resize-none leading-relaxed" />
            <Mono className="text-[8px] text-muted">{msg.length}/160 ký tự</Mono>
          </div>

          <button onClick={handleSend}
            className={`w-full py-2 rounded-md border-none text-white text-[11px] font-bold tracking-wide cursor-pointer transition-all
              ${sent ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-red-500'}`}>
            {sent ? '✅ ĐÃ GỬI THÀNH CÔNG' : '📤 GỬI THÔNG BÁO KHẨN CẤP'}
          </button>

          <Divider />

          <div className="text-[11px] font-bold text-tx mb-2">Nhật ký hoạt động</div>
          {[
            { t: '10:48 AM', u: 'Admin',    m: 'Đã gửi Zalo tới nhóm PCTT Huyện', dot: 'bg-safe' },
            { t: '10:45 AM', u: 'Hệ thống', m: `Mực nước vượt ${sel?.waterLevel}m`, dot: 'bg-warning' },
          ].map(({ t, u, m, dot }, i) => (
            <div key={i} className="flex gap-2 mb-2.5">
              <div className={`w-1.5 h-1.5 rounded-full ${dot} mt-1.5 shrink-0`} />
              <div>
                <div className="text-[10px] text-tx">{m}</div>
                <Mono className="text-[8px] text-muted">{t} — {u}</Mono>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
