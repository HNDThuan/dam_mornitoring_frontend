// Returns Tailwind-compatible class strings per status
export const STATUS = {
  critical: {
    label: 'NGUY CẤP',
    text: 'text-danger',
    bg: 'bg-danger-soft',
    border: 'border-danger-soft',
    leftBorder: 'border-l-danger',
    topBorder: 'border-t-danger',
    dot: 'bg-danger',
  },
  danger: {
    label: 'NGUY HIỂM',
    text: 'text-danger',
    bg: 'bg-danger-soft',
    border: 'border-danger-soft',
    leftBorder: 'border-l-danger',
    topBorder: 'border-t-danger',
    dot: 'bg-danger',
  },
  warning: {
    label: 'CẢNH BÁO',
    text: 'text-warning',
    bg: 'bg-warning-soft',
    border: 'border-warning-soft',
    leftBorder: 'border-l-warning',
    topBorder: 'border-t-warning',
    dot: 'bg-warning',
  },
  safe: {
    label: 'AN TOÀN',
    text: 'text-safe',
    bg: 'bg-safe-soft',
    border: 'border-safe-soft',
    leftBorder: 'border-l-safe',
    topBorder: 'border-t-safe',
    dot: 'bg-safe',
  },
  info: {
    label: 'CHÚ Ý',
    text: 'text-info',
    bg: 'bg-info-soft',
    border: 'border-info-soft',
    leftBorder: 'border-l-info',
    topBorder: 'border-t-info',
    dot: 'bg-info',
  },
}

export const getStatus = (s) => STATUS[s] || STATUS.info

/** Map backend severity string → statusConfig key */
export const SEVERITY_TO_STATUS = {
  CRITICAL: 'critical',
  ALERT: 'danger',
  WARNING: 'warning',
  NORMAL: 'safe',
}

export const getStatusBySeverity = (severity) => getStatus(SEVERITY_TO_STATUS[severity] || 'info')
