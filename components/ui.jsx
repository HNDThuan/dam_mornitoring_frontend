import { getStatus } from '@/lib/statusConfig'

export function Mono({ children, className = '', ...rest }) {
  return <span className={`font-mono ${className}`} {...rest}>{children}</span>
}

export function Badge({ status, sm }) {
  const s = getStatus(status)
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-mono font-bold tracking-wider border
      ${sm ? 'text-[10px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1'}
      rounded-full ${s.text} ${s.bg} ${s.border}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} shrink-0`} />
      {s.label}
    </span>
  )
}

export function Divider({ className = '', vertical = false }) {
  if (vertical) return <div className={`w-px bg-border my-auto h-8 ${className}`} />
  return <div className={`h-px bg-border/70 my-3 ${className}`} />
}

export function Label({ children, className = '' }) {
  return (
    <div className={`text-[11px] text-muted font-bold tracking-[0.14em] uppercase mb-2 ${className}`}>
      {children}
    </div>
  )
}

export function Card({ children, className = '', glass = false }) {
  return (
    <div className={`${glass ? 'glass-panel' : 'bg-card border border-border'} rounded-xl shadow-panel ${className}`}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`text-xl font-bold text-tx tracking-wide ${className}`}>
      {children}
    </h2>
  )
}

/** Small pulsing indicator dot used for live/connected states */
export function LiveDot({ active = true, size = 'sm', pulse = true }) {
  const dim = size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'
  return (
    <span className="relative inline-flex shrink-0">
      <span className={`${dim} rounded-full ${active ? 'bg-safe' : 'bg-faint'}`} />
      {active && pulse && (
        <span className={`absolute inset-0 rounded-full bg-safe animate-pulse-ring`} />
      )}
    </span>
  )
}

/**
 * Standard HMI panel: header (title + optional right-side slot) over a bordered body.
 * Use for any boxed section on the dashboard/pages to keep chrome consistent.
 */
export function Panel({ title, right, children, className = '', bodyClassName, glass = false }) {
  return (
    <Card glass={glass} className={`overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/70">
          <span className="text-[11px] text-muted font-bold tracking-[0.14em] uppercase">{title}</span>
          {right}
        </div>
      )}
      <div className={bodyClassName ?? 'p-3.5'}>{children}</div>
    </Card>
  )
}

/** KPI tile for top-of-dashboard summary rows */
export function StatTile({ icon: Icon, label, value, unit, trend, status = 'info', className = '' }) {
  const s = getStatus(status)
  return (
    <Card className={`p-3.5 relative overflow-hidden ${className}`}>
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${s.bg} blur-2xl opacity-60`} aria-hidden="true" />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-[10px] text-muted font-bold tracking-[0.12em] uppercase mb-1.5 truncate">{label}</div>
          <div className="flex items-baseline gap-1">
            <Mono className={`text-2xl font-bold ${s.text} leading-none`}>{value}</Mono>
            {unit && <span className="text-[10px] text-muted">{unit}</span>}
          </div>
          {trend != null && (
            <div className={`mt-1.5 text-[10px] font-mono ${trend > 0 ? 'text-danger' : trend < 0 ? 'text-safe' : 'text-muted'}`}>
              {trend > 0 ? '▲' : trend < 0 ? '▼' : '—'} {Math.abs(trend)}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`shrink-0 w-9 h-9 rounded-lg ${s.bg} border ${s.border} flex items-center justify-center`}>
            <Icon className={`w-4.5 h-4.5 ${s.text}`} />
          </div>
        )}
      </div>
    </Card>
  )
}

/** Compact SVG radial gauge — value 0-100, colored by status */
export function RadialGauge({ value = 0, size = 96, stroke = 8, status = 'info', label, sublabel }) {
  const s = getStatus(status)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c
  const colorVar = {
    danger: '#fb4360', critical: '#a855f7', warning: '#f59e0b', safe: '#22c55e', info: '#38bdf8',
  }[status] || '#38bdf8'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,184,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={colorVar} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Mono className={`font-bold ${s.text}`} style={{ fontSize: size * 0.2 }}>
          {label ?? `${Math.round(pct)}%`}
        </Mono>
        {sublabel && <span className="text-[8px] text-muted uppercase tracking-wide mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}

/**
 * Standard pagination footer: "Hiển thị X–Y trong tổng số Z" + Trước/Sau controls.
 * Controlled — pass current `page` (1-indexed) and `onPageChange`. Renders nothing
 * when there's nothing to paginate (totalItems <= pageSize).
 */
export function Pagination({ page, pageSize, totalItems, onPageChange, itemLabel = 'bản ghi', className = '' }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalItems <= pageSize) return null

  const start = totalItems > 0 ? (page - 1) * pageSize + 1 : 0
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className={`flex flex-col sm:flex-row justify-between items-center gap-2 px-3.5 py-2.5 border-t border-border/70 bg-card2/30 ${className}`}>
      <Mono className="text-[9px] text-muted">
        Hiển thị {start}–{end} trong tổng số {totalItems} {itemLabel}
      </Mono>

      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="px-2 py-0.5 rounded-lg text-[10px] border border-border bg-transparent text-muted hover:text-tx hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Trước
        </button>
        <Mono className="text-[10px] text-tx px-2">
          Trang {page} / {totalPages}
        </Mono>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          className="px-2 py-0.5 rounded-lg text-[10px] border border-border bg-transparent text-muted hover:text-tx hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Sau
        </button>
      </div>
    </div>
  )
}

/** Inline mini trend line for a series of numbers */
export function Sparkline({ data = [], width = 72, height = 24, status = 'info', strokeWidth = 1.5 }) {
  const colorVar = {
    danger: '#fb4360', critical: '#a855f7', warning: '#f59e0b', safe: '#22c55e', info: '#38bdf8',
  }[status] || '#38bdf8'

  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="flex items-center text-[9px] text-faint">—</div>
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ')
  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={areaPoints} fill={colorVar} fillOpacity={0.08} stroke="none" />
      <polyline points={points} fill="none" stroke={colorVar} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
