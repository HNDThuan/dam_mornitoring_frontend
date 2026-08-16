'use client'

import { AlertCircle, ChevronDown, X, Loader2, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

const CONTROL_BASE = 'w-full bg-card2 border rounded-md text-tx text-[13px] placeholder:text-faint focus-visible:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const CONTROL_BORDER = (error) => (error ? 'border-danger focus:border-danger' : 'border-border focus:border-accent')

/** Uppercase field label with optional required marker */
export function FieldLabel({ children, required, htmlFor, className = '' }) {
  return (
    <label htmlFor={htmlFor} className={`block text-[11px] font-bold uppercase tracking-wide text-muted mb-1.5 ${className}`}>
      {children}
      {required && <span className="text-danger ml-0.5">*</span>}
    </label>
  )
}

export function FieldError({ children }) {
  if (!children) return null
  return (
    <p className="mt-1.5 text-[11px] text-danger flex items-center gap-1">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{children}</span>
    </p>
  )
}

export function FieldHint({ children }) {
  if (!children) return null
  return <p className="mt-1.5 text-[10px] text-faint">{children}</p>
}

/** Label + control + error/hint wrapper — the standard unit for one form field */
export function Field({ label, required, error, hint, htmlFor, children, className = '' }) {
  return (
    <div className={className}>
      {label && <FieldLabel required={required} htmlFor={htmlFor}>{label}</FieldLabel>}
      {children}
      <FieldError>{error}</FieldError>
      {!error && hint && <FieldHint>{hint}</FieldHint>}
    </div>
  )
}

/** Text/number/email/password input with optional leading icon and error state */
export function TextInput({ icon: Icon, error, className = '', ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon className="w-4 h-4 text-faint absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />}
      <input
        {...props}
        className={`${CONTROL_BASE} ${Icon ? 'pl-10' : 'pl-3.5'} pr-3.5 py-2.5 ${CONTROL_BORDER(error)} ${className}`}
      />
    </div>
  )
}

export function Textarea({ error, className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      className={`${CONTROL_BASE} px-3.5 py-2.5 resize-none ${CONTROL_BORDER(error)} ${className}`}
    />
  )
}

/** Native select with a themed chevron (the default browser arrow doesn't match the dark UI) */
export function Select({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${CONTROL_BASE} appearance-none pl-3.5 pr-9 py-2.5 cursor-pointer ${CONTROL_BORDER(error)} ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-faint absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}

/** Right-aligned action row, typically Cancel + Primary, with a divider above */
export function FormActions({ children, className = '' }) {
  return <div className={`flex justify-end gap-2 pt-4 mt-2 border-t border-border/40 ${className}`}>{children}</div>
}

const BUTTON_VARIANTS = {
  primary: 'bg-accent hover:bg-accent/90 text-white',
  secondary: 'border border-border text-muted bg-transparent hover:bg-white/5 hover:text-tx',
  danger: 'bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 hover:border-danger/40',
  safe: 'bg-safe hover:bg-safe/90 text-white',
}

/** Standard button — pass `loading` to show a spinner and auto-disable */
export function Button({ variant = 'primary', loading = false, disabled, className = '', children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      {...props}
      className={`px-4 py-2.5 rounded-md text-[11px] font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
      {children}
    </button>
  )
}

/**
 * Standard dialog: scrim + solid card with a header (title/icon/close) and
 * scrollable body. Pass `footer` (typically FormActions) for the action row.
 */
export function Modal({ open, onClose, title, icon: Icon, children, footer, maxWidth = 'max-w-md' }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`bg-card border border-borderHi rounded-lg w-full ${maxWidth} shadow-2xl max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="w-4 h-4 text-accent shrink-0" />}
              <h3 className="text-sm font-bold text-tx">{title}</h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-muted hover:text-tx cursor-pointer p-1 rounded-md hover:bg-white/5 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="p-6 space-y-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 pb-6 shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

/** Inline banner for top-of-form success/error feedback */
export function FormAlert({ variant = 'danger', icon: Icon, children }) {
  if (!children) return null
  const styles = {
    danger: 'bg-danger/10 border-danger/20 text-danger',
    safe: 'bg-safe/10 border-safe/30 text-safe',
    warning: 'bg-warning/10 border-warning/30 text-warning',
  }
  return (
    <div className={`p-3 rounded-md border text-xs font-semibold flex items-center gap-2 ${styles[variant]}`}>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span>{children}</span>
    </div>
  )
}

const TOAST_CONFIG = {
  success: { bg: 'bg-safe', icon: CheckCircle2 },
  safe: { bg: 'bg-safe', icon: CheckCircle2 },
  info: { bg: 'bg-accent', icon: Info },
  warning: { bg: 'bg-warning', icon: AlertTriangle },
  danger: { bg: 'bg-danger', icon: AlertCircle },
  error: { bg: 'bg-danger', icon: AlertCircle },
}

/**
 * Floating toast notification, fixed bottom-right. Pass `toast` as
 * `{ message, type }` (type: success/info/warning/danger) or null to hide.
 */
export function Toast({ toast, onClose }) {
  if (!toast) return null
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.success
  const Icon = cfg.icon
  return (
    <div className="fixed bottom-4 right-4 z-[10000] max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
      <div className={`flex items-center gap-3 pl-3 pr-2.5 py-2.5 rounded-xl shadow-2xl text-white animate-toast-in ${cfg.bg}`}>
        <span className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </span>
        <span className="text-[12px] font-semibold flex-1 min-w-0">{toast.message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white cursor-pointer p-1 rounded-md hover:bg-white/15 transition-colors shrink-0"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
