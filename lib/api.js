const API_URL = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== '') 
  ? process.env.NEXT_PUBLIC_API_URL.trim() 
  : 'https://library-opal-degraded.ngrok-free.dev'

const customHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': '69420',
}

function getAuthHeaders(token = null) {
  const headers = { ...customHeaders }
  const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`
  }
  return headers
}

// ── In-Memory Cache with TTL & Request Deduplication ──
const memoryCache = new Map()
const inFlightRequests = new Map()

export const DEFAULT_CACHE_TTL = 30 * 1000 // 30 seconds
export const SHORT_CACHE_TTL = 5 * 1000    // 5 seconds

/**
 * Fetch với bộ nhớ đệm In-Memory Cache, tự hết hạn theo TTL và gộp trùng lặp request (Deduplication)
 * @param {string} key - Cache key (URL kèm query params)
 * @param {Function} fetcher - Hàm async gọi fetch thực tế
 * @param {number} ttlMs - Thời gian sống của cache (milliseconds)
 * @param {boolean} forceRefresh - Bỏ qua cache để lấy dữ liệu mới nhất
 */
export async function cachedFetch(key, fetcher, ttlMs = DEFAULT_CACHE_TTL, forceRefresh = false) {
  const now = Date.now()

  // 1. Trả về từ Cache nếu còn hạn và không ép refresh
  if (!forceRefresh && memoryCache.has(key)) {
    const entry = memoryCache.get(key)
    if (now < entry.expiry) {
      return entry.data
    }
    memoryCache.delete(key)
  }

  // 2. Gộp request (Deduplicate) nếu đang có request cùng key đang chạy
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)
  }

  // 3. Thực thi request và lưu vào Cache
  const promise = (async () => {
    try {
      const data = await fetcher()
      if (data !== undefined && data !== null) {
        memoryCache.set(key, {
          data,
          expiry: Date.now() + ttlMs,
        })
      }
      return data
    } finally {
      inFlightRequests.delete(key)
    }
  })()

  inFlightRequests.set(key, promise)
  return promise
}

/**
 * Xóa cache theo tiền tố hoặc danh sách tiền tố (Cache Invalidation)
 * @param {string|string[]} prefixes
 */
export function invalidateCache(prefixes) {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes]
  for (const key of memoryCache.keys()) {
    for (const p of prefixList) {
      if (key.includes(p)) {
        memoryCache.delete(key)
        break
      }
    }
  }
}

/**
 * Xóa toàn bộ In-Memory Cache
 */
export function clearAllCache() {
  memoryCache.clear()
  inFlightRequests.clear()
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
 * GET /sensor/latest — lấy snapshot mới nhất + history 60 điểm cho một stationId hoặc clusterId
 * Dữ liệu realtime — luôn lấy snapshot mới nhất
 * Returns: { data: SensorSnapshot | null, history: SensorHistory }
 */
export async function fetchLatest(stationId, clusterId) {
  const params = new URLSearchParams()
  if (stationId) params.set('stationId', String(stationId))
  if (clusterId) params.set('clusterId', clusterId)
  const queryStr = params.toString() ? `?${params.toString()}` : ''

  const res = await fetch(`${API_URL}/sensor/latest${queryStr}`, {
    cache: 'no-store',
    headers: customHeaders,
  })
  if (!res.ok) throw new Error(`GET /sensor/latest failed: ${res.status}`)
  return res.json()
}

/**
 * GET /sensor/alarms — lấy danh sách sự kiện cảnh báo (Cache ngắn 5s)
 * @param {string} damId - ID đập (mặc định 'dam_1')
 * @param {number} limit - Số lượng tối đa
 * @param {string} severity - Lọc theo mức: 'WARNING' | 'ALERT' | 'CRITICAL'
 * @param {boolean|undefined} resolved - Lọc theo trạng thái xử lý
 * Returns: { alarms: AlarmEvent[] }
 */
export async function fetchAlarmEvents(damId = 'dam_1', limit = 50, severity, resolved, token = null, forceRefresh = false) {
  const headers = getAuthHeaders(token)

  const params = new URLSearchParams()
  if (damId) params.set('damId', damId)
  if (limit) params.set('limit', String(limit))
  if (severity) params.set('severity', severity)
  if (resolved !== undefined) params.set('resolved', String(resolved))
  const url = `${API_URL}/sensor/alarms?${params}`

  return cachedFetch(
    url,
    async () => {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers,
          credentials: 'include',
        })
        if (!res.ok) {
          console.warn(`[API] GET /sensor/alarms error status: ${res.status}`)
          return { alarms: [] }
        }
        return await res.json()
      } catch (err) {
        console.error('[API] fetchAlarmEvents network error:', err)
        return { alarms: [] }
      }
    },
    SHORT_CACHE_TTL,
    forceRefresh,
  )
}

/**
 * GET /sensor/thresholds — lấy cấu hình ngưỡng cảnh báo (Cache 30s)
 * @param {string} damId
 * Returns: { configs: ThresholdConfig[] }
 */
export async function fetchThresholdConfigs(damId = 'dam_1', forceRefresh = false) {
  const url = `${API_URL}/sensor/thresholds?damId=${damId}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: customHeaders,
      })
      if (!res.ok) throw new Error(`GET /sensor/thresholds failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function updateThresholdConfig(id, data, token = null) {
  const res = await fetch(`${API_URL}/sensor/thresholds/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /sensor/thresholds/${id} failed: ${res.status}`)
  invalidateCache(['/sensor/thresholds'])
  return json
}

/**
 * PUT /sensor/alarms/:id/resolve — đánh dấu sự kiện đã xử lý
 * @param {string} id - UUID của alarm event
 * Returns: { ok: true, data: AlarmEvent }
 */
export async function resolveAlarmEvent(id, token = null) {
  const res = await fetch(`${API_URL}/sensor/alarms/${id}/resolve`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /sensor/alarms/${id}/resolve failed: ${res.status}`)
  invalidateCache(['/sensor/alarms'])
  return json
}

/**
 * POST /sensor/send-email-alert — gửi email thông báo khẩn cấp
 * @param {Object} data - { toEmail, message, alarmId? }
 */
export async function sendEmailAlert(data, token = null) {
  const res = await fetch(`${API_URL}/sensor/send-email-alert`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /sensor/send-email-alert failed: ${res.status}`)
  return json
}

/**
 * GET /sensor/dam-managers — lấy danh sách Cán bộ phụ trách Đập tương ứng
 * @param {string} damId
 */
export async function fetchDamManagers(damId) {
  if (!damId) return { managers: [] }
  try {
    const res = await fetch(`${API_URL}/sensor/dam-managers?damId=${damId}`, {
      cache: 'no-store',
      headers: customHeaders,
    })
    if (!res.ok) return { managers: [] }
    return await res.json()
  } catch (err) {
    console.error('[API] fetchDamManagers error:', err)
    return { managers: [] }
  }
}

/**
 * GET /sensor/history/long-term — lấy chuỗi dữ liệu lịch sử cảm biến từ CSDL
 */
export async function fetchLongTermHistory(params = {}) {
  const query = new URLSearchParams()
  if (params.type && params.type !== 'all') query.set('type', params.type)
  if (params.damId && params.damId !== 'all') query.set('damId', params.damId)
  if (params.stationId) query.set('stationId', params.stationId)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)
  if (params.limit) query.set('limit', params.limit || 100)

  try {
    const res = await fetch(`${API_URL}/sensor/history/long-term?${query.toString()}`, {
      cache: 'no-store',
      headers: customHeaders,
    })
    if (!res.ok) return { data: [] }
    return await res.json()
  } catch (err) {
    console.error('[API] fetchLongTermHistory error:', err)
    return { data: [] }
  }
}

/**
 * GET /sensor/history/kpi — lấy thống kê KPI lịch sử thực tế từ CSDL
 */
export async function fetchHistoryKpi(params = {}) {
  const query = new URLSearchParams()
  if (params.damId && params.damId !== 'all') query.set('damId', params.damId)
  if (params.startDate) query.set('startDate', params.startDate)
  if (params.endDate) query.set('endDate', params.endDate)

  try {
    const res = await fetch(`${API_URL}/sensor/history/kpi?${query.toString()}`, {
      cache: 'no-store',
      headers: customHeaders,
    })
    if (!res.ok) return { kpi: null }
    return await res.json()
  } catch (err) {
    console.error('[API] fetchHistoryKpi error:', err)
    return { kpi: null }
  }
}

// ── Dam APIs (Cached 30s) ──
export async function fetchDams(forceRefresh = false) {
  const url = `${API_URL}/dams`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /dams failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchDamById(id, forceRefresh = false) {
  const url = `${API_URL}/dams/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /dams/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createDam(data, token = null) {
  const res = await fetch(`${API_URL}/dams`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /dams failed: ${res.status}`)
  invalidateCache(['/dams', '/stations'])
  return json
}

export async function updateDam(id, data, token = null) {
  const res = await fetch(`${API_URL}/dams/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /dams/${id} failed: ${res.status}`)
  invalidateCache(['/dams', '/stations'])
  return json
}

export async function deleteDam(id, token = null) {
  const res = await fetch(`${API_URL}/dams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /dams/${id} failed: ${res.status}`)
  invalidateCache(['/dams', '/stations'])
  return json
}

// ── Station APIs (Cached 30s) ──
export async function fetchStations(damId, forceRefresh = false) {
  const url = damId ? `${API_URL}/stations?damId=${damId}` : `${API_URL}/stations`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /stations failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchStationById(id, forceRefresh = false) {
  const url = `${API_URL}/stations/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /stations/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createStation(data, token = null) {
  const res = await fetch(`${API_URL}/stations`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /stations failed: ${res.status}`)
  invalidateCache(['/stations', '/dams', '/api/gateways', '/api/nodes'])
  return json
}

export async function updateStation(id, data, token = null) {
  const res = await fetch(`${API_URL}/stations/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /stations/${id} failed: ${res.status}`)
  invalidateCache(['/stations', '/dams', '/api/gateways', '/api/nodes'])
  return json
}

export async function deleteStation(id, token = null) {
  const res = await fetch(`${API_URL}/stations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /stations/${id} failed: ${res.status}`)
  invalidateCache(['/stations', '/dams', '/api/gateways', '/api/nodes'])
  return json
}

/**
 * Chuẩn hóa URL ảnh vết nứt và proxy qua /api/image để tránh lỗi ERR_NGROK_6024.
 * <img src> không thể gửi header tới Ngrok, nên phải route qua Next.js API proxy server-side.
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
      // Nếu domain là localhost hoặc 127.0.0.1, lấy pathname để proxy qua backend
      if (u.hostname.includes('localhost') || u.hostname.includes('127.0.0.1')) {
        path = u.pathname
      } else if (u.hostname.includes('vercel.app')) {
        path = u.pathname
      } else {
        // URL đầy đủ hợp lệ (Ngrok, domain khác) — bọc qua /api/image proxy để tránh lỗi 6024
        return `/api/image?url=${encodeURIComponent(path)}`
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

  // Tạo absolute URL Ngrok đầy đủ rồi bọc qua /api/image proxy
  const cleanBase = baseUrl.replace(/\/+$/, '')
  const absoluteUrl = `${cleanBase}${path}`
  return `/api/image?url=${encodeURIComponent(absoluteUrl)}`
}

// ── Gateway & Node IoT Management APIs (Cached 30s) ──

export async function fetchGateways(stationId, forceRefresh = false) {
  const params = new URLSearchParams()
  if (stationId) params.set('stationId', String(stationId))
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const url = `${API_URL}/api/gateways${queryStr}`

  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/gateways failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchGatewayById(id, forceRefresh = false) {
  const url = `${API_URL}/api/gateways/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/gateways/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createGateway(data, token = null) {
  const res = await fetch(`${API_URL}/api/gateways`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /api/gateways failed: ${res.status}`)
  invalidateCache(['/api/gateways', '/api/nodes', '/stations', '/dams'])
  return json
}

export async function updateGateway(id, data, token = null) {
  const res = await fetch(`${API_URL}/api/gateways/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/gateways/${id} failed: ${res.status}`)
  invalidateCache(['/api/gateways', '/api/nodes', '/stations', '/dams'])
  return json
}

export async function deleteGateway(id, token = null) {
  const res = await fetch(`${API_URL}/api/gateways/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /api/gateways/${id} failed: ${res.status}`)
  invalidateCache(['/api/gateways', '/api/nodes', '/stations', '/dams'])
  return json
}

export async function fetchNodes(gatewayId, stationId, damId, forceRefresh = false) {
  const params = new URLSearchParams()
  if (gatewayId) params.set('gatewayId', gatewayId)
  if (stationId) params.set('stationId', String(stationId))
  if (damId && damId !== 'all') params.set('damId', String(damId))
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const url = `${API_URL}/api/nodes${queryStr}`

  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/nodes failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function fetchNodeById(id, forceRefresh = false) {
  const url = `${API_URL}/api/nodes/${id}`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/nodes/${id} failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function createNode(data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /api/nodes failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function updateNode(id, data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/nodes/${id} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function deleteNode(id, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /api/nodes/${id} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function mapNodeCamera(nodeId, cameraId, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/map-camera`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify({ cameraId }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/nodes/${nodeId}/map-camera failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function fetchNodeSensors(nodeId, forceRefresh = false) {
  const url = `${API_URL}/api/nodes/${nodeId}/sensors`
  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
      if (!res.ok) throw new Error(`GET /api/nodes/${nodeId}/sensors failed: ${res.status}`)
      return res.json()
    },
    DEFAULT_CACHE_TTL,
    forceRefresh,
  )
}

export async function addNodeSensor(nodeId, data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/sensors`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `POST /api/nodes/${nodeId}/sensors failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function updateNodeSensor(nodeId, sensorId, data, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/sensors/${sensorId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /api/nodes/${nodeId}/sensors/${sensorId} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

export async function deleteNodeSensor(nodeId, sensorId, token = null) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/sensors/${sensorId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `DELETE /api/nodes/${nodeId}/sensors/${sensorId} failed: ${res.status}`)
  invalidateCache(['/api/nodes', '/api/gateways', '/stations', '/dams'])
  return json
}

// ── Auth & User APIs ──
export async function loginUser(data) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: customHeaders,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đăng nhập thất bại')
  clearAllCache()
  return json
}

export async function registerUser(data) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Đăng ký thất bại')
  return json
}

export async function logoutUser() {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: 'POST',
    headers: customHeaders,
    credentials: 'include',
  })
  clearAllCache()
  if (!res.ok) throw new Error('Đăng xuất thất bại')
  return res.json()
}

export async function fetchMe(token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/auth/me`, {
    headers,
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

/**
 * PUT /auth/me — tự cập nhật hồ sơ cá nhân (fullName/phoneNumber/password) của
 * chính người dùng đang đăng nhập. Khác với updateUser() (chỉ ADMIN mới gọi được
 * PUT /users/:id) — endpoint này mở cho mọi role đã đăng nhập, tự sửa hồ sơ của mình.
 */
export async function updateProfile(data, token = null) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Cập nhật hồ sơ thất bại')
  return json
}

export async function fetchUsers(token, forceRefresh = false) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const url = `${API_URL}/users`

  return cachedFetch(
    url,
    async () => {
      const res = await fetch(url, {
        headers,
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) throw new Error('Không thể lấy danh sách người dùng')
      return res.json()
    },
    10000,
    forceRefresh,
  )
}

export async function approveUser(id, data, token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/users/${id}/approve`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Phê duyệt thất bại')
  invalidateCache(['/users'])
  return json
}

export async function updateUser(id, data, token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PUT',
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Cập nhật thất bại')
  invalidateCache(['/users'])
  return json
}

// ── Audit Logs API (Dành riêng cho ADMIN) ──
/**
 * GET /audit-logs — phân trang thật ở backend (skip/take), trả về
 * { logs, total, page, pageSize } để frontend dựng UI phân trang.
 */
export async function fetchAuditLogs(category = 'ALL', limit = 20, token = null, page = 1) {
  const headers = { ...customHeaders }
  const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

  const query = new URLSearchParams()
  if (category && category !== 'ALL') query.append('category', category)
  if (limit) query.append('limit', String(limit))
  if (page) query.append('page', String(page))

  const res = await fetch(`${API_URL}/audit-logs?${query.toString()}`, {
    headers,
    credentials: 'include',
    cache: 'no-store',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Không thể lấy nhật ký hệ thống')
  return json
}

export async function deleteUser(id, token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Xóa thất bại')
  invalidateCache(['/users'])
  return json
}
