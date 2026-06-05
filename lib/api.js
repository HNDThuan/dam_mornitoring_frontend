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
