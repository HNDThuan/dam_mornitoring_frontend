const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * POST /sensor/all — gửi data sensor lên backend
 * @param {Object} data - { freq, amp, waterLevel, moisture, percent? }
 */
export async function postSensorData(data) {
  const res = await fetch(`${API_URL}/sensor/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST /sensor/all failed: ${res.status}`)
  return res.json()
}

/**
 * GET /sensor/latest — lấy snapshot mới nhất + history 60 điểm
 * Returns: { data: SensorSnapshot | null, history: SensorHistory }
 *
 * SensorSnapshot: { freq, amp, waterLevel, moisture, percent, timestamp }
 * SensorHistory:  { timestamps[], freq[], amp[], waterLevel[], moisture[], percent[] }
 */
export async function fetchLatest() {
  const res = await fetch(`${API_URL}/sensor/latest`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`GET /sensor/latest failed: ${res.status}`)
  return res.json()
}

/**
 * GET /sensor/alarms — lấy danh sách sự kiện cảnh báo
 * @param {string} damId - ID đập (mặc định 'dam_1')
 * @param {number} limit - Số lượng tối đa
 * @param {string} severity - Lọc theo mức: 'WARNING' | 'ALERT' | 'CRITICAL'
 * @param {boolean|undefined} resolved - Lọc theo trạng thái xử lý
 * Returns: { alarms: AlarmEvent[] }
 */
export async function fetchAlarmEvents(damId = 'dam_1', limit = 50, severity, resolved) {
  const params = new URLSearchParams({ damId, limit: String(limit) })
  if (severity) params.set('severity', severity)
  if (resolved !== undefined) params.set('resolved', String(resolved))
  const res = await fetch(`${API_URL}/sensor/alarms?${params}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`GET /sensor/alarms failed: ${res.status}`)
  return res.json()
}
/**
 * GET /sensor/thresholds — lấy cấu hình ngưỡng cảnh báo
 * @param {string} damId
 * Returns: { configs: ThresholdConfig[] }
 */
export async function fetchThresholdConfigs(damId = 'dam_1') {
  const res = await fetch(`${API_URL}/sensor/thresholds?damId=${damId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`GET /sensor/thresholds failed: ${res.status}`)
  return res.json()
}
/**
 * PUT /sensor/alarms/:id/resolve — đánh dấu sự kiện đã xử lý
 * @param {string} id - UUID của alarm event
 * Returns: { ok: true, data: AlarmEvent }
 */
export async function resolveAlarmEvent(id) {
  const res = await fetch(`${API_URL}/sensor/alarms/${id}/resolve`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`PUT /sensor/alarms/${id}/resolve failed: ${res.status}`)
  return res.json()
}
