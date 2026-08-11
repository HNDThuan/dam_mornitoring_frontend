import { getStatus } from '@/lib/statusConfig'

export function Mono({ children, className = '' }) {
  return <span className={`font-mono ${className}`}>{children}</span>
}

export function Badge({ status, sm }) {
  const s = getStatus(status)
  return (
    <span className={`
      inline-block font-mono font-bold tracking-wider border
      ${sm ? 'text-[11px] px-2 py-0.5' : 'text-[12px] px-2.5 py-1'}
      rounded ${s.text} ${s.bg} ${s.border}
    `}>
      {s.label}
    </span>
  )
}

export function Divider({ className = '', vertical = false }) {
  if (vertical) return <div className={`w-px bg-border my-auto h-8 ${className}`} />
  return <div className={`h-px bg-border my-3 ${className}`} />
}

export function Label({ children, className = '' }) {
  return (
    <div className={`text-[12px] text-muted font-bold tracking-widest uppercase mb-2 ${className}`}>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-lg ${className}`}>
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
