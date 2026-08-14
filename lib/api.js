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
 * GET /sensor/alarms — lấy danh sách sự kiện cảnh báo
 * @param {string} damId - ID đập (mặc định 'dam_1')
 * @param {number} limit - Số lượng tối đa
 * @param {string} severity - Lọc theo mức: 'WARNING' | 'ALERT' | 'CRITICAL'
 * @param {boolean|undefined} resolved - Lọc theo trạng thái xử lý
 * Returns: { alarms: AlarmEvent[] }
 */
export async function fetchAlarmEvents(damId = 'dam_1', limit = 50, severity, resolved, token = null) {
  const headers = getAuthHeaders(token)

  const params = new URLSearchParams()
  if (damId) params.set('damId', damId)
  if (limit) params.set('limit', String(limit))
  if (severity) params.set('severity', severity)
  if (resolved !== undefined) params.set('resolved', String(resolved))

  try {
    const res = await fetch(`${API_URL}/sensor/alarms?${params}`, {
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

export async function updateThresholdConfig(id, data, token = null) {
  const res = await fetch(`${API_URL}/sensor/thresholds/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    credentials: 'include',
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || `PUT /sensor/thresholds/${id} failed: ${res.status}`)
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

// ── Dam APIs ──
export async function fetchDams() {
  const res = await fetch(`${API_URL}/dams`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /dams failed: ${res.status}`)
  return res.json()
}

export async function fetchDamById(id) {
  const res = await fetch(`${API_URL}/dams/${id}`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /dams/${id} failed: ${res.status}`)
  return res.json()
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
  return json
}

// ── Station APIs ──
export async function fetchStations(damId) {
  const url = damId ? `${API_URL}/stations?damId=${damId}` : `${API_URL}/stations`
  const res = await fetch(url, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /stations failed: ${res.status}`)
  return res.json()
}

export async function fetchStationById(id) {
  const res = await fetch(`${API_URL}/stations/${id}`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /stations/${id} failed: ${res.status}`)
  return res.json()
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

// ── Gateway & Node IoT Management APIs ──

export async function fetchGateways(stationId) {
  const params = new URLSearchParams()
  if (stationId) params.set('stationId', String(stationId))
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/api/gateways${queryStr}`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /api/gateways failed: ${res.status}`)
  return res.json()
}

export async function fetchGatewayById(id) {
  const res = await fetch(`${API_URL}/api/gateways/${id}`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /api/gateways/${id} failed: ${res.status}`)
  return res.json()
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
  return json
}

export async function fetchNodes(gatewayId) {
  const params = new URLSearchParams()
  if (gatewayId) params.set('gatewayId', gatewayId)
  const queryStr = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API_URL}/api/nodes${queryStr}`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /api/nodes failed: ${res.status}`)
  return res.json()
}

export async function fetchNodeById(id) {
  const res = await fetch(`${API_URL}/api/nodes/${id}`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /api/nodes/${id} failed: ${res.status}`)
  return res.json()
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
  return json
}

export async function fetchNodeSensors(nodeId) {
  const res = await fetch(`${API_URL}/api/nodes/${nodeId}/sensors`, { cache: 'no-store', headers: customHeaders })
  if (!res.ok) throw new Error(`GET /api/nodes/${nodeId}/sensors failed: ${res.status}`)
  return res.json()
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
  return json
}

// ── Backward Compatibility Wrappers for Sensor Clusters ──
export async function fetchSensorClusters(stationId, damId) {
  try {
    const data = await fetchNodes()
    const nodes = data.nodes || []
    return {
      clusters: nodes.map((n) => ({
        ...n,
        devices: n.sensors || n.devices || [],
        espMacAddress: n.macAddress || n.espMacAddress || '',
        stationId: n.gateway?.stationId || n.stationId,
        station: n.gateway?.station || n.station,
      })),
    }
  } catch {
    return { clusters: [] }
  }
}

export async function fetchSensorClusterById(id) {
  const res = await fetchNodeById(id)
  const node = res.node || res
  return {
    ...node,
    devices: node.sensors || node.devices || [],
    espMacAddress: node.macAddress || node.espMacAddress || '',
    stationId: node.gateway?.stationId || node.stationId,
    station: node.gateway?.station || node.station,
  }
}

export async function createSensorCluster(data, token = null) {
  return createNode(data, token)
}

export async function updateSensorCluster(id, data, token = null) {
  return updateNode(id, data, token)
}

export async function deleteSensorCluster(id, token = null) {
  return deleteNode(id, token)
}

export async function addSensorDevice(clusterId, data, token = null) {
  return addNodeSensor(clusterId, data, token)
}

export async function updateSensorDevice(clusterId, deviceId, data, token = null) {
  return updateNodeSensor(clusterId, deviceId, data, token)
}

export async function deleteSensorDevice(clusterId, deviceId, token = null) {
  return deleteNodeSensor(clusterId, deviceId, token)
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

export async function fetchUsers(token) {
  const headers = { ...customHeaders }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}/users`, {
    headers,
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Không thể lấy danh sách người dùng')
  return res.json()
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
  return json
}

// ── Audit Logs API (Dành riêng cho ADMIN) ──
export async function fetchAuditLogs(category = 'ALL', limit = 100, token = null) {
  const headers = { ...customHeaders }
  const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null)
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

  const query = new URLSearchParams()
  if (category && category !== 'ALL') query.append('category', category)
  if (limit) query.append('limit', String(limit))

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
  return json
}
