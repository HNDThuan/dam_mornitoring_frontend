'use client'

import { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { HISTORY_RECORDS, genHistoryLine, genHistoryBar } from '@/lib/mockData'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'

const lineData = genHistoryLine()
const barData  = genHistoryBar()
const TOOLTIP  = { background: '#0d1520', border: '1px solid #1a2a3a', borderRadius: 4, fontSize: 9 }

export default function HistoryPage() {
  const [search, setSearch] = useState('')
  const filtered = HISTORY_RECORDS.filter(r =>
    !search || r.code.toLowerCase().includes(search.toLowerCase()) || r.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="grid gap-3.5 p-4 min-h-[calc(100vh-48px)]" style={{ gridTemplateColumns: '210px 1fr' }}>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-3.5 self-start">
        <h2 className="text-[13px] font-bold text-tx mb-3.5">Bộ Lọc Dữ Liệu</h2>

        {[['Khoảng thời gian', ['Tháng này (T8/2023)', 'Tháng trước', 'Quý này']],
          ['Chọn Trạm / Đoạn đê', ['Tất cả các trạm', 'TR-HY-01', 'TR-ND-05']]].map(([lb, opts]) => (
          <div key={lb} className="mb-3">
            <Label className="mb-1.5">{lb}</Label>
            <select className="w-full bg-card2 border border-border rounded px-2 py-1.5 text-tx text-[11px] outline-none">
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}

        <div className="mb-3">
          <Label className="mb-2">Loại sự kiện</Label>
          {[['Cảnh báo mực nước', true, 'bg-info'], ['Lũ lịch sử', true, 'bg-danger'], ['Sự cố kỹ thuật', false, 'bg-warning']].map(([lb, on, cl]) => (
            <div key={lb} className="flex items-center gap-2 mb-2 cursor-pointer">
              <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center transition-all
                ${on ? `${cl} border-transparent` : 'bg-transparent border-border'}`}>
                {on && <span className="text-[9px] text-white leading-none">✓</span>}
              </div>
              <span className="text-[11px] text-tx">{lb}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-2 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-md text-white text-[12px] font-bold border-none cursor-pointer">
          Áp dụng bộ lọc
        </button>
      </div>

      {/* Content */}
      <div>
        {/* Header */}
        <div className="flex justify-between items-end mb-3.5">
          <div>
            <h1 className="text-xl font-bold text-tx tracking-wide">LỊCH SỬ & PHÂN TÍCH DỮ LIỆU SỰ CỐ</h1>
            <Mono className="text-[9px] text-muted">Dữ liệu cập nhật lần cuối: 15:30, 24/08/2023</Mono>
          </div>
          <div className="flex gap-2">
            {['⬇ Xuất Excel', '⬇ Xuất PDF'].map(lb => (
              <button key={lb} className="flex items-center gap-1 px-2.5 py-1.5 border border-border rounded bg-transparent text-tx text-[10px] font-semibold cursor-pointer hover:bg-white/5">{lb}</button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-3 mb-3.5">
          {[
            { icon: '⚠️', val: '12',      lb: 'Tổng số cảnh báo trong kỳ', badge: '+12% vs kỳ trước',  cl: 'text-warning' },
            { icon: '💧', val: '7.45m',   lb: 'Mực nước đỉnh (Hưng Yên)',  badge: 'Cao hơn BĐ 2',      cl: 'text-danger'  },
            { icon: '⏱️', val: '18 phút', lb: 'Thời gian phản ứng TB',     badge: '-2 phút cải thiện', cl: 'text-safe'    },
          ].map(({ icon, val, lb, badge, cl }) => (
            <div key={lb} className="bg-card border border-border rounded-lg p-3.5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg">{icon}</span>
                <Mono className={`text-[8px] ${cl} bg-card2 px-1.5 py-0.5 rounded-sm`}>{badge}</Mono>
              </div>
              <Mono className={`text-2xl font-bold block ${cl}`}>{val}</Mono>
              <p className="text-[10px] text-muted mt-1.5">{lb}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <div className="bg-card border border-border rounded-lg p-3.5">
            <div className="text-[12px] font-semibold text-tx mb-2">So sánh Mực nước & Đỉnh lũ lịch sử</div>
            <div className="flex gap-3 mb-2">
              {[['#38bdf8', 'Hiện tại'], ['#f43f5e', 'Lũ 1971'], ['#fb923c', 'Lũ 1996']].map(([cl, lb]) => (
                <div key={lb} className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5" style={{ background: cl }} />
                  <span className="text-[8px] text-muted">{lb}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={145}>
              <LineChart data={lineData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a2a3a" />
                <XAxis dataKey="d" tick={{ fontSize: 7, fill: '#4a6070' }} tickLine={false} />
                <YAxis tick={{ fontSize: 7, fill: '#4a6070' }} tickLine={false} domain={[4, 10]} />
                <Tooltip contentStyle={TOOLTIP} />
                <Line type="monotone" dataKey="c"   stroke="#38bdf8" strokeWidth={2}   dot={false} />
                <Line type="monotone" dataKey="l71" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="l96" stroke="#fb923c" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-lg p-3.5">
            <div className="text-[12px] font-semibold text-tx mb-2">Phân bố Cảnh báo theo Ngày</div>
            <div className="flex gap-3 mb-2">
              {[['#fb923c', 'Cảnh báo'], ['#f43f5e', 'Khẩn cấp']].map(([cl, lb]) => (
                <div key={lb} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cl }} />
                  <span className="text-[8px] text-muted">{lb}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={145}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#1a2a3a" />
                <XAxis dataKey="d" tick={{ fontSize: 7, fill: '#4a6070' }} tickLine={false} />
                <YAxis tick={{ fontSize: 7, fill: '#4a6070' }} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="cb" fill="#fb923c" opacity={.85} radius={[2, 2, 0, 0]} />
                <Bar dataKey="kc" fill="#f43f5e" opacity={.85} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-border">
            <span className="text-[12px] font-semibold text-tx">Chi tiết bản ghi dữ liệu</span>
            <div className="flex items-center gap-1.5 bg-card2 border border-border rounded px-2 py-1">
              <span className="text-[10px]">🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm trạm, sự kiện..."
                className="bg-transparent border-none outline-none text-tx text-[10px] w-36 placeholder:text-muted" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-card2">
                  {['THỜI GIAN', 'MÃ TRẠM', 'VỊ TRÍ', 'MỰC NƯỚC', 'CẤP BÁO ĐỘNG', 'TRẠNG THÁI', 'THAO TÁC'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[8px] text-muted font-bold uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const as = getStatus(r.alertLv)
                  const ss = getStatus(r.statusLv)
                  return (
                    <tr key={i} className="border-t border-border hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-2"><Mono className="text-[9px] text-muted">{r.time}</Mono></td>
                      <td className="px-3 py-2"><Mono className="text-[10px] text-info">{r.code}</Mono></td>
                      <td className="px-3 py-2 text-[11px] text-tx whitespace-nowrap">{r.location}</td>
                      <td className="px-3 py-2"><Mono className={`text-[13px] font-bold ${as.text}`}>{r.level}</Mono></td>
                      <td className="px-3 py-2"><Badge status={r.alertLv} sm /></td>
                      <td className="px-3 py-2"><Badge status={r.statusLv} sm /></td>
                      <td className="px-3 py-2">
                        <button className="text-accent text-[10px] font-bold bg-transparent border-none cursor-pointer hover:underline">CHI TIẾT</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center px-3.5 py-2 border-t border-border">
            <Mono className="text-[9px] text-muted">Hiển thị 1–{filtered.length} của 127</Mono>
            <div className="flex gap-1">
              {[1, 2, 3].map(n => (
                <button key={n} className={`w-6 h-6 rounded text-[10px] border cursor-pointer
                  ${n === 1 ? 'bg-accent-soft border-accent text-accent' : 'bg-transparent border-border text-muted hover:bg-white/5'}`}>{n}</button>
              ))}
              <Mono className="text-[10px] text-muted leading-6 px-1">... 21</Mono>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
