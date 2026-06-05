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
 * Tính trạng thái mực nước dựa trên ngưỡng BĐ
 */
export function getWaterStatus(waterLevel, bd3, bd2, bd1) {
  if (waterLevel >= bd3) return { label: 'VƯỢT BĐ3', level: 'danger' }
  if (waterLevel >= bd2) return { label: 'VƯỢT BĐ2', level: 'warning' }
  if (waterLevel >= bd1) return { label: 'BĐ1',       level: 'warning' }
  return { label: 'AN TOÀN', level: 'safe' }
}

/**
 * Tính trạng thái độ ẩm
 */
export function getMoistureStatus(moisture) {
  if (moisture >= 85) return { label: 'NGUY HIỂM', level: 'danger' }
  if (moisture >= 75) return { label: 'CẦN CHÚ Ý', level: 'warning' }
  return { label: 'ỔN ĐỊNH', level: 'safe' }
}

/**
 * Tính trạng thái độ rung (freq Hz)
 * Ngưỡng ví dụ — điều chỉnh theo thực tế
 */
export function getVibrationStatus(freq) {
  if (freq >= 8)  return { label: 'NGUY HIỂM', level: 'danger' }
  if (freq >= 5)  return { label: 'CẦN CHÚ Ý', level: 'warning' }
  return { label: 'AN TOÀN', level: 'safe' }
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
