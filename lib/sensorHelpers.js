import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react'

/**
 * Chuyển history array của backend thành format recharts
 * Backend trả về: { timestamps: [], freq: [], amp: [], waterLevel: [], moisture: [], percent: [] }
 * Recharts cần:   [{ t, v }, ...]
 */
export function historyToChartData(history, field) {
  if (!history || !history.timestamps?.length) return []
  return history.timestamps.map((ts, i) => ({
    t: formatTime(ts),
    v: history[field]?.[i] ?? 0,
  }))
}

/**
 * Format ISO timestamp → "HH:MM"
 */
export function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}

/**
 * Tính trạng thái mực nước
 * - Hiển thị dùng bd1/bd2/bd3 truyền thống
 * - Logic cảnh báo lấy từ ThresholdConfig backend nếu có
 *
 * @param {number} waterLevel - Mực nước hiện tại
 * @param {number} bd3 - Ngưỡng Báo Động 3 (từ station data, dùng cho hiển thị)
 * @param {number} bd2 - Ngưỡng Báo Động 2
 * @param {number} bd1 - Ngưỡng Báo Động 1
 * @param {object} [thresholds] - ThresholdConfig từ backend { warnHigh, alertHigh, criticalHigh }
 */
export function getWaterStatus(waterLevel, bd3, bd2, bd1, thresholds) {
  // Nếu có ThresholdConfig từ backend → dùng logic backend
  if (thresholds) {
    if (waterLevel >= thresholds.criticalHigh)
      return { label: 'VƯỢT BĐ3', level: 'danger', severity: 'CRITICAL' }
    if (waterLevel >= thresholds.alertHigh)
      return { label: 'VƯỢT BĐ2', level: 'danger', severity: 'ALERT' }
    if (waterLevel >= thresholds.warnHigh)
      return { label: 'BĐ1', level: 'warning', severity: 'WARNING' }
    return { label: 'AN TOÀN', level: 'safe', severity: 'NORMAL' }
  }

  // Fallback: dùng bd1/bd2/bd3 truyền thống
  if (waterLevel >= bd3) return { label: 'VƯỢT BĐ3', level: 'danger', severity: 'CRITICAL' }
  if (waterLevel >= bd2) return { label: 'VƯỢT BĐ2', level: 'warning', severity: 'ALERT' }
  if (waterLevel >= bd1) return { label: 'BĐ1', level: 'warning', severity: 'WARNING' }
  return { label: 'AN TOÀN', level: 'safe', severity: 'NORMAL' }
}

/**
 * Tính trạng thái độ ẩm
 * Backend mặc định: warnHigh=75, alertHigh=85, criticalHigh=95
 * @param {number} moisture
 * @param {object} [thresholds] - ThresholdConfig từ backend
 */
export function getMoistureStatus(moisture, thresholds) {
  const critHigh = thresholds?.criticalHigh ?? 95
  const alertHigh = thresholds?.alertHigh ?? 85
  const warnHigh = thresholds?.warnHigh ?? 75

  if (moisture >= critHigh) return { label: 'NGUY CẤP', level: 'danger', severity: 'CRITICAL' }
  if (moisture >= alertHigh) return { label: 'BÁO ĐỘNG', level: 'danger', severity: 'ALERT' }
  if (moisture >= warnHigh) return { label: 'CẦN CHÚ Ý', level: 'warning', severity: 'WARNING' }
  return { label: 'ỔN ĐỊNH', level: 'safe', severity: 'NORMAL' }
}

/**
 * Tính trạng thái độ rung (amplitude mm/s)
 * Backend mặc định: warnHigh=2.5, alertHigh=15.0, criticalHigh=25.0
 * Đánh giá dựa trên biên độ rung (amp) — khớp với backend
 * @param {number} amp
 * @param {object} [thresholds] - ThresholdConfig từ backend
 */
export function getVibrationStatus(amp, thresholds) {
  const critHigh = thresholds?.criticalHigh ?? 25
  const alertHigh = thresholds?.alertHigh ?? 15
  const warnHigh = thresholds?.warnHigh ?? 2.5

  if (amp >= critHigh) return { label: 'NGUY CẤP', level: 'danger', severity: 'CRITICAL' }
  if (amp >= alertHigh) return { label: 'BÁO ĐỘNG', level: 'danger', severity: 'ALERT' }
  if (amp >= warnHigh) return { label: 'CẦN CHÚ Ý', level: 'warning', severity: 'WARNING' }
  return { label: 'AN TOÀN', level: 'safe', severity: 'NORMAL' }
}

/**
 * Tính delta giữa 2 giá trị cuối trong history
 */
export function calcDelta(arr) {
  if (!arr || arr.length < 2) return { delta: 0, up: null }
  const delta = +(arr[arr.length - 1] - arr[arr.length - 2]).toFixed(2)
  return { delta: Math.abs(delta), up: delta > 0 ? true : delta < 0 ? false : null }
}

/**
 * Tính min, max, avg của một mảng số
 */
export function calcStats(arr) {
  if (!arr?.length) return { min: 0, max: 0, avg: 0 }
  const min = Math.min(...arr)
  const max = Math.max(...arr)
  const avg = +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)
  return { min, max, avg }
}

// ── Alarm Helpers ──────────────────────────────────────────────────

/** Map backend severity → frontend display level */
export const SEVERITY_MAP = {
  CRITICAL: { label: 'NGUY CẤP', level: 'danger', icon: AlertOctagon, priority: 3 },
  ALERT: { label: 'BÁO ĐỘNG', level: 'danger', icon: AlertTriangle, priority: 2 },
  WARNING: { label: 'CẦN CHÚ Ý', level: 'warning', icon: AlertCircle, priority: 1 },
  NORMAL: { label: 'AN TOÀN', level: 'safe', icon: CheckCircle2, priority: 0 },
}

/** Map backend sensorType → Vietnamese label */
export const SENSOR_TYPE_LABELS = {
  vibration: 'Rung động',
  water_level: 'Mực nước',
  humidity: 'Độ ẩm rò rỉ',
}

/** Map backend sensorType → unit */
export const SENSOR_TYPE_UNITS = {
  vibration: 'mm/s',
  water_level: 'cm',
  humidity: '%',
}

/** Format thời gian tương đối (vd: "5P TRƯỚC", "2H TRƯỚC") */
export function timeAgo(dateStr) {
  if (!dateStr) return '--'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins}P`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}H`
  const days = Math.floor(hours / 24)
  return `${days}N`
}
