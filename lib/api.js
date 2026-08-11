const API_URL = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') 
  ? process.env.NEXT_PUBLIC_API_URL.trim() 
  : 'https://library-opal-degraded.ngrok-free.dev'

const customHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
}

/**
 * POST /sensor/all — gửi data sensor lên backend
 * @param {Object} data - { freq, amp, waterLevel, moisture, percent? }
 */
export async function postSensorData(data) {
  const res = await fetch(`${API_URL}/sensor/all`, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST /sensor/all failed: ${res.status}`)
  return res.json()
}

/**
 * GET /sensor/latest — lấy snapshot mới nhất + history 60 điểm
 * Returns: { data: SensorSnapshot | null, history: SensorHistory }
 */
export async function fetchLatest() {
  const res = await fetch(`${API_URL}/sensor/latest`, {
    cache: 'no-store',
    headers: customHeaders,
  })
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

  const res = await fetch(`${API_URL}/sensor/alarms?${params}`, {
    cache: 'no-store',
    headers: customHeaders,
  })
  if (!res.ok) throw new Error(`GET /sensor/alarms failed: ${res.status}`)
  return res.json()
}

/**
 * GET /sensor/thresholds — lấy cấu hình ngưỡng cảnh báo
 * @param {string} damId
 * Returns: { configs: ThresholdConfig[] }
 */
export async function fetchThresholdConfigs(damId = 'dam_1') {
  const res = await fetch(`${API_URL}/sensor/thresholds?damId=${damId}`, {
    cache: 'no-store',
    headers: customHeaders,
  })
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
    headers: customHeaders,
  })
  if (!res.ok) throw new Error(`PUT /sensor/alarms/${id}/resolve failed: ${res.status}`)
  return res.json()
}

/**
 * POST /sensor/send-email-alert — gửi email thông báo khẩn cấp
 * @param {Object} data - { toEmail, message, alarmId? }
 */
export async function sendEmailAlert(data) {
  const res = await fetch(`${API_URL}/sensor/send-email-alert`, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`POST /sensor/send-email-alert failed: ${res.status}`)
  return res.json()
}

/**
 * Chuẩn hóa URL ảnh vết nứt từ MinIO/Backend để hiển thị mượt mà trên mọi thiết bị (LAN, Mobile, Vercel, Ngrok)
 * @param {string} url 
 * @returns {string|null}
 */
export function getFormattedImageUrl(url) {
  if (!url) return null

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') 
    ? process.env.NEXT_PUBLIC_API_URL.trim() 
    : 'https://library-opal-degraded.ngrok-free.dev'

  let path = url

  // Nếu chứa MinIO localhost port 9000 hoặc /dam-images/
  if (path.includes('/dam-images/')) {
    const parts = path.split('/dam-images/')
    path = `/sensor/images/${parts[1]}`
  } else if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const u = new URL(path)
      // Nếu domain trùng với host Vercel hoặc localhost:9000/127.0.0.1:9000, lấy pathname
      if (u.hostname.includes('localhost') || u.hostname.includes('127.0.0.1') || u.hostname.includes('vercel.app')) {
        path = u.pathname
      } else {
        // Đã là URL đầy đủ hoàn chỉnh (ví dụ ngrok khác)
        return path
      }
    } catch {
      // ignore
    }
  }

  // Đảm bảo path bắt đầu bằng /sensor/images/
  if (!path.startsWith('/')) {
    path = `/${path}`
  }
  if (!path.startsWith('/sensor/images/')) {
    path = `/sensor/images${path.replace(/^\/sensor/, '')}`
  }

  // Ghép với baseUrl (Backend Ngrok URL)
  const cleanBase = baseUrl.replace(/\/+$/, '')
  return `${cleanBase}${path}`
}


