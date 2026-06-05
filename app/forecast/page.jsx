import { Mono } from '@/components/ui'

const FEATURES = ['Mô phỏng vỡ đê', 'Mô phỏng xả lũ', 'Dự báo mực nước 72h', 'Risk Level Index', 'HEC-HMS v4.2', 'Bản đồ ngập lụt']

const TIMELINE = [
  { phase: 'Phase 1', desc: 'Tích hợp API trạm thủy văn quốc gia', status: 'done',    q: 'Q1 2024' },
  { phase: 'Phase 2', desc: 'Xây dựng mô hình HEC-HMS',            status: 'active',  q: 'Q2 2024' },
  { phase: 'Phase 3', desc: 'Mô phỏng vỡ đê & xả lũ',             status: 'pending', q: 'Q3 2024' },
  { phase: 'Phase 4', desc: 'Bản đồ ngập lụt & cảnh báo tự động',  status: 'pending', q: 'Q4 2024' },
]

export default function ForecastPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] p-8 gap-7 text-center">

      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl border border-border bg-accent/10 flex items-center justify-center text-4xl">
        🔧
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-tx tracking-widest mb-2">ĐANG PHÁT TRIỂN</h1>
        <Mono className="text-[12px] text-muted max-w-md leading-relaxed block">
          Tính năng Dự báo & Mô phỏng đang được xây dựng.<br />
          Sẽ bao gồm mô phỏng vỡ đê, xả lũ và dự báo 72h tích hợp mô hình thủy văn quốc tế.
        </Mono>
      </div>

      {/* Feature tags */}
      <div className="flex gap-2 flex-wrap justify-center max-w-lg">
        {FEATURES.map(f => (
          <span key={f} className="font-mono text-[10px] text-accent bg-accent-soft border border-accent-soft px-2.5 py-1 rounded">
            {f}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-xl p-5 max-w-md w-full">
        <div className="text-[13px] font-bold text-tx tracking-widest uppercase mb-4">Lộ trình phát triển</div>
        <div className="flex flex-col gap-3.5">
          {TIMELINE.map(({ phase, desc, status, q }) => {
            const isDone   = status === 'done'
            const isActive = status === 'active'
            return (
              <div key={phase} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 text-[13px] transition-colors
                  ${isDone ? 'bg-safe-soft border-safe text-safe' : isActive ? 'bg-accent-soft border-accent text-accent' : 'bg-transparent border-border text-muted'}`}>
                  {isDone ? '✓' : isActive ? '⚙' : '○'}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[12px] font-semibold text-tx">{phase} — {desc}</span>
                </div>
                <Mono className={`text-[9px] shrink-0 px-2 py-0.5 rounded
                  ${isDone ? 'text-safe bg-safe-soft' : isActive ? 'text-accent bg-accent-soft' : 'text-muted bg-card2'}`}>
                  {q}
                </Mono>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
