'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchGateways,
  fetchDams,
  fetchStations,
  deleteGateway,
  deleteNode,
  deleteNodeSensor,
  deleteCamera,
} from '@/lib/api'
import { Mono, Panel, StatTile, Pagination } from '@/components/ui'
import { Modal, FormActions, Button, Toast } from '@/components/form'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Trash2,
  RefreshCw,
  Search,
  AlertTriangle,
  Cpu,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Droplets,
  Thermometer,
  Activity,
  Server,
  Video,
  Camera as CameraIcon,
  ExternalLink,
  MapPin,
  ShieldAlert,
  Zap,
  Sliders,
  CheckCircle2,
} from 'lucide-react'

const SENSOR_TYPE_CONFIG = {
  water_level: { label: 'Mực nước', icon: Droplets, color: 'text-sky-400', bgColor: 'bg-sky-400/10', defaultModel: 'HC-SR04', unit: 'cm' },
  wtl: { label: 'Mực nước', icon: Droplets, color: 'text-sky-400', bgColor: 'bg-sky-400/10', defaultModel: 'HC-SR04', unit: 'cm' },
  humidity: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'DHT22', unit: '%' },
  moisture: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'Capacitive v1.2', unit: '%' },
  mst: { label: 'Độ ẩm', icon: Thermometer, color: 'text-emerald-400', bgColor: 'bg-emerald-400/10', defaultModel: 'Capacitive v1.2', unit: '%' },
  vibration: { label: 'Độ rung', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-400/10', defaultModel: 'MPU6050', unit: 'mm/s' },
  vib: { label: 'Độ rung', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-400/10', defaultModel: 'MPU6050', unit: 'mm/s' },
}

const getSensorTypeConfig = (rawType) => {
  if (!rawType) return SENSOR_TYPE_CONFIG.water_level
  const t = String(rawType).toLowerCase()
  if (t === 'vib' || t === 'vibration' || t.startsWith('vib')) return SENSOR_TYPE_CONFIG.vibration
  if (t === 'wtl' || t === 'water_level' || t === 'water') return SENSOR_TYPE_CONFIG.water_level
  if (t === 'mst' || t === 'moisture' || t === 'humidity') return SENSOR_TYPE_CONFIG.moisture
  return SENSOR_TYPE_CONFIG[t] || SENSOR_TYPE_CONFIG.water_level
}

const STATUS_CONFIG = {
  online: { label: 'Online', dot: 'bg-safe', text: 'text-safe', bg: 'bg-safe-soft', border: 'border-safe-soft' },
  offline: { label: 'Offline', dot: 'bg-muted', text: 'text-muted', bg: 'bg-white/5', border: 'border-border' },
  error: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger', bg: 'bg-danger-soft', border: 'border-danger-soft' },
}

const SENSOR_STATUS_CONFIG = {
  active: { label: 'Hoạt động', dot: 'bg-safe', text: 'text-safe' },
  inactive: { label: 'Ngừng', dot: 'bg-muted', text: 'text-muted' },
  faulty: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
}

const CAMERA_STATUS_CONFIG = {
  active: { label: 'Hoạt động', dot: 'bg-safe', text: 'text-safe' },
  inactive: { label: 'Ngừng', dot: 'bg-muted', text: 'text-muted' },
  error: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
}

export default function GatewaysPage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const [gateways, setGateways] = useState([])
  const [dams, setDams] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterDamId, setFilterDamId] = useState('')
  const [filterStationId, setFilterStationId] = useState('')

  // Phân trang
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  // Hàng mở rộng: gateway -> khối Node/Camera, node -> danh sách Sensor
  const [expandedGateways, setExpandedGateways] = useState(new Set())
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Xóa modal: { kind: 'gateway' | 'node' | 'camera' | 'sensor', id, name, parentId? }
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [])

  // ── Tải dữ liệu toàn cục ──
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [gatewaysRes, damsRes, stationsRes] = await Promise.all([
        fetchGateways(filterStationId || undefined, filterDamId || undefined, true),
        fetchDams(),
        fetchStations(filterDamId || undefined),
      ])

      setGateways(gatewaysRes.gateways || [])
      setDams(damsRes.dams || [])
      setStations(stationsRes.stations || [])
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filterDamId, filterStationId])

  useEffect(() => {
    if (isAdmin) {
      loadData(false)
    }
  }, [isAdmin, loadData])

  // Trạm khả dụng cho ô lọc
  const filteredStations = filterDamId
    ? stations.filter((s) => s.damId === filterDamId)
    : stations

  // Tìm kiếm toàn cục
  const filteredGateways = gateways.filter((gw) => {
    if (!search) return true
    const q = search.toLowerCase()
    const inSelf =
      gw.gatewayId?.toLowerCase().includes(q) ||
      gw.name?.toLowerCase().includes(q) ||
      gw.macAddress?.toLowerCase().includes(q) ||
      gw.station?.name?.toLowerCase().includes(q)
    const inNodes = (gw.nodes || []).some(
      (n) => n.nodeId?.toLowerCase().includes(q) || n.name?.toLowerCase().includes(q),
    )
    const inCameras = (gw.cameras || []).some(
      (c) => c.cameraId?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q),
    )
    return inSelf || inNodes || inCameras
  })

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredGateways.length / pageSize))
    if (page > totalPages) setPage(totalPages)
  }, [filteredGateways.length, page, pageSize])

  const paginatedGateways = filteredGateways.slice((page - 1) * pageSize, page * pageSize)

  const toggleSet = (setter) => (key) => {
    setter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const toggleGateway = toggleSet(setExpandedGateways)
  const toggleNode = toggleSet(setExpandedNodes)

  // ── Xử lý Xóa Thiết Bị (Chỉ Admin) ──
  const DELETE_LABEL = {
    gateway: 'Gateway',
    node: 'Sensor Node',
    camera: 'Camera AI',
    sensor: 'Cảm biến',
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    const { kind, id, name, parentId } = deleteConfirm
    try {
      setDeleting(true)
      if (kind === 'gateway') await deleteGateway(id)
      else if (kind === 'node') await deleteNode(id)
      else if (kind === 'camera') await deleteCamera(id)
      else if (kind === 'sensor') await deleteNodeSensor(parentId, id)

      showToast(`Đã xóa ${DELETE_LABEL[kind]} ${name || id}!`, 'success')
      setDeleteConfirm(null)
      loadData(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Chưa kết nối'
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 60000) return `${Math.floor(diff / 1000)}s trước`
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
    return `${Math.floor(diff / 86400000)} ngày trước`
  }

  // ── KIỂM TRA QUYỀN TRUY CẬP (CHỈ ADMIN) ──
  if (authLoading) {
    return (
      <div className="p-12 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-accent" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="p-8 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-tx">Quyền Truy Cập Bị Giới Hạn</h2>
          <p className="text-xs text-muted leading-relaxed">
            Trang Quản Trị Hạ Tầng Thiết Bị Toàn Cục chỉ dành cho tài khoản <strong>ADMIN TỔNG</strong>.
          </p>
          <p className="text-[11px] text-muted">
            Nếu bạn là Cán bộ vận hành (Operator), vui lòng truy cập vào trang <strong>Chi Tiết Trạm</strong> tương ứng để quản lý thiết bị trực thuộc.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <Link
              href="/dams"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-card2 border border-border rounded-xl text-xs font-semibold text-tx no-underline hover:bg-white/5"
            >
              <span>Về Trang Đập</span>
            </Link>
            <Link
              href="/stations"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold no-underline hover:bg-accent/90 shadow-glow"
            >
              <span>Về Danh Sách Trạm</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Stats
  const onlineCount = gateways.filter((g) => g.status === 'online').length
  const offlineCount = gateways.filter((g) => g.status === 'offline').length
  const errorCount = gateways.filter((g) => g.status === 'error').length
  const totalNodes = gateways.reduce((acc, g) => acc + (g.nodes?.length || 0), 0)
  const totalCameras = gateways.reduce((acc, g) => acc + (g.cameras?.length || 0), 0)

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">Quản Lý Hạ Tầng Gateway & Thiết Bị (Admin)</h1>
            <span className="text-[9px] font-mono font-bold bg-accent/10 text-accent border border-accent/30 px-2 py-0.5 rounded-full">
              READ & DELETE ONLY
            </span>
          </div>
          <p className="text-[10px] text-muted m-0">
            Giám sát danh mục toàn bộ Gateways (Jetson TX2), Nodes (ESP32) và Camera AI trên toàn hệ thống. Để thêm hoặc cấu hình thiết bị, vui lòng vào trang Chi tiết Trạm tương ứng.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <select
            value={filterDamId}
            onChange={(e) => {
              setFilterDamId(e.target.value)
              setFilterStationId('')
            }}
            className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] focus-visible:outline-none focus:border-accent shrink-0 cursor-pointer"
          >
            <option value="">Tất cả đập</option>
            {dams.map((d) => (
              <option key={d.damId} value={d.damId}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={filterStationId}
            onChange={(e) => setFilterStationId(e.target.value)}
            className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] focus-visible:outline-none focus:border-accent shrink-0 cursor-pointer"
          >
            <option value="">Tất cả trạm</option>
            {filteredStations.map((s) => (
              <option key={s.stationId} value={s.stationId}>
                {s.name}
              </option>
            ))}
          </select>

          <div className="h-9 flex items-center gap-2 bg-card2 border border-border rounded-lg px-3 w-56 shrink-0 focus-within:border-accent">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm Gateway, Node, Camera..."
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={() => loadData(false)}
            className="h-9 flex items-center gap-1.5 px-3.5 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile
          icon={Server}
          label="Tổng Số Gateway"
          value={gateways.length}
          unit="thiết bị"
          status="info"
        />
        <StatTile
          icon={Wifi}
          label="Gateway Online"
          value={onlineCount}
          unit="đang chạy"
          status="safe"
        />
        <StatTile
          icon={WifiOff}
          label="Gateway Offline"
          value={offlineCount}
          unit="mất kết nối"
          status={offlineCount > 0 ? 'warning' : 'safe'}
        />
        <StatTile
          icon={Cpu}
          label="Tổng Sensor Node"
          value={totalNodes}
          unit="ESP32"
          status="info"
        />
        <StatTile
          icon={Video}
          label="Camera Giám Sát"
          value={totalCameras}
          unit="CSI / RTSP"
          status="safe"
        />
      </div>

      {/* Content List */}
      <Panel
        title={
          <div className="flex items-center gap-2">
            <span>Danh mục Gateway & Thiết bị toàn quốc</span>
            <span className="text-[9px] font-mono text-muted bg-card3 px-2 py-0.5 rounded-full border border-border">
              {filteredGateways.length} Gateway
            </span>
          </div>
        }
      >
        {loading ? (
          <div className="p-8 text-center text-muted text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-accent" />
            <span>Đang tải danh sách thiết bị...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-danger text-xs bg-danger/10 border border-danger/30 rounded-xl">
            Lỗi tải dữ liệu: {error}
          </div>
        ) : paginatedGateways.length === 0 ? (
          <div className="p-8 text-center text-muted text-xs italic">
            Không tìm thấy Gateway hoặc thiết bị nào phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedGateways.map((gw) => {
              const isGwExpanded = expandedGateways.has(gw.gatewayId)
              const gwStatus = STATUS_CONFIG[gw.status] || STATUS_CONFIG.offline
              const allStationCameras = gw.cameras || []

              return (
                <div
                  key={gw.gatewayId}
                  className="bg-card2 border border-border rounded-xl overflow-hidden shadow-panel transition-all"
                >
                  {/* Gateway Header */}
                  <div
                    onClick={() => toggleGateway(gw.gatewayId)}
                    className="px-4 py-3.5 bg-card3/40 hover:bg-card3 border-b border-border/70 flex items-center justify-between cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-muted hover:text-tx p-0.5 bg-transparent border-none cursor-pointer">
                        {isGwExpanded ? (
                          <ChevronDown className="w-4 h-4 text-accent" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                        <Server className="w-4 h-4 text-accent" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-tx">{gw.name}</span>
                          <Mono className="text-[10px] text-accent font-semibold bg-accent/10 border border-accent/20 px-1.5 py-0.2 rounded">
                            {gw.gatewayId}
                          </Mono>
                          <span
                            className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${gwStatus.text} ${gwStatus.bg} ${gwStatus.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${gwStatus.dot}`} />
                            {gwStatus.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted">
                          <span>
                            Trạm:{' '}
                            <strong className="text-tx">{gw.station?.name || gw.stationId || 'Chưa gán'}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            MAC: <Mono className="text-tx">{gw.macAddress || '—'}</Mono>
                          </span>
                          <span>•</span>
                          <span>
                            Firmware: <Mono className="text-tx">{gw.firmwareVersion || '—'}</Mono>
                          </span>
                          <span>•</span>
                          <span>Last seen: {timeAgo(gw.lastSeenAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: View at Station + Delete */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {gw.stationId && (
                        <Link
                          href={`/stations/${gw.stationId}?tab=devices`}
                          className="flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent border border-accent/30 rounded-lg text-[10px] font-bold hover:bg-accent/20 transition-colors no-underline"
                          title="Mở trang Trạm để cấu hình phần cứng"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Xem tại Trạm</span>
                        </Link>
                      )}

                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            kind: 'gateway',
                            id: gw.gatewayId,
                            name: gw.name,
                          })
                        }
                        className="p-1.5 text-muted hover:text-danger bg-card hover:bg-danger/10 border border-border rounded-lg transition-colors cursor-pointer"
                        title="Xóa Gateway"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Gateway Content (Nodes + Cameras) */}
                  {isGwExpanded && (
                    <div className="p-4 space-y-4 bg-card/30">
                      {/* CAMERAS */}
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                          <Video className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Camera Giám Sát AI ({gw.cameras?.length || 0})</span>
                        </div>

                        {gw.cameras && gw.cameras.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {gw.cameras.map((cam) => {
                              const camSt =
                                CAMERA_STATUS_CONFIG[cam.status] || CAMERA_STATUS_CONFIG.active
                              return (
                                <div
                                  key={cam.cameraId}
                                  className="bg-card border border-border rounded-lg p-2.5 flex items-start justify-between"
                                >
                                  <div className="flex items-start gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0 mt-0.5">
                                      <CameraIcon className="w-3.5 h-3.5 text-emerald-400" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-tx truncate">
                                        {cam.name}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <Mono className="text-[9px] text-emerald-400">
                                          {cam.cameraId}
                                        </Mono>
                                        <span className="text-[9px] text-muted">
                                          ({cam.cameraType || 'CSI'})
                                        </span>
                                        <span className="text-[8px] font-mono text-muted">
                                          {cam.resolution}
                                        </span>
                                      </div>
                                      {cam.streamUrl && (
                                        <div
                                          className="text-[9px] font-mono text-muted truncate max-w-[200px] mt-0.5"
                                          title={cam.streamUrl}
                                        >
                                          {cam.streamUrl}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() =>
                                      setDeleteConfirm({
                                        kind: 'camera',
                                        id: cam.cameraId,
                                        name: cam.name,
                                      })
                                    }
                                    className="p-1 text-muted hover:text-danger bg-transparent border-none cursor-pointer shrink-0"
                                    title="Xóa Camera"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted italic bg-card/40 border border-border/50 rounded-lg p-2.5 text-center">
                            Chưa có Camera nào gắn vào Gateway này.
                          </div>
                        )}
                      </div>

                      {/* SENSOR NODES */}
                      <div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                          <Cpu className="w-3.5 h-3.5 text-info" />
                          <span>Danh Sách Sensor Nodes ESP32 ({gw.nodes?.length || 0})</span>
                        </div>

                        {gw.nodes && gw.nodes.length > 0 ? (
                          <div className="space-y-3">
                            {gw.nodes.map((node) => {
                              const isNodeExpanded = expandedNodes.has(node.nodeId)
                              const nodeSt = STATUS_CONFIG[node.status] || STATUS_CONFIG.offline
                              const mappedCam = allStationCameras.find(
                                (c) => c.cameraId === node.mappedCameraId,
                              )

                              return (
                                <div
                                  key={node.nodeId}
                                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                                >
                                  {/* Node Header */}
                                  <div
                                    onClick={() => toggleNode(node.nodeId)}
                                    className="px-3.5 py-2.5 bg-card2/60 hover:bg-card2 border-b border-border/60 flex items-center justify-between cursor-pointer select-none transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <button className="text-muted hover:text-tx p-0.5 bg-transparent border-none cursor-pointer">
                                        {isNodeExpanded ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-info" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5" />
                                        )}
                                      </button>

                                      <div className="w-6 h-6 rounded-md bg-info/10 border border-info/20 flex items-center justify-center shrink-0">
                                        <Cpu className="w-3.5 h-3.5 text-info" />
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-tx">{node.name}</span>
                                          <Mono className="text-[10px] text-info font-semibold bg-info/10 border border-info/20 px-1.5 py-0.2 rounded">
                                            {node.nodeId}
                                          </Mono>
                                          <span
                                            className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${nodeSt.text} ${nodeSt.bg} ${nodeSt.border}`}
                                          >
                                            <span className={`w-1 h-1 rounded-full ${nodeSt.dot}`} />
                                            {nodeSt.label}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[9px] text-muted mt-0.5">
                                          <span>
                                            Vị trí:{' '}
                                            <strong className="text-tx">
                                              {node.installLocation || 'Thân đập'}
                                            </strong>
                                          </span>
                                          <span>•</span>
                                          <span>
                                            MAC: <Mono className="text-tx">{node.macAddress || '—'}</Mono>
                                          </span>
                                          <span>•</span>
                                          <span>
                                            Firmware: <Mono className="text-tx">{node.firmwareVersion || 'v1.0'}</Mono>
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Node Actions */}
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                      {mappedCam ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                                          <CameraIcon className="w-2.5 h-2.5" />
                                          <span>Cam AI: {mappedCam.name || mappedCam.cameraId}</span>
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-muted">Chưa gán Cam AI</span>
                                      )}

                                      <button
                                        onClick={() =>
                                          setDeleteConfirm({
                                            kind: 'node',
                                            id: node.nodeId,
                                            name: node.name,
                                          })
                                        }
                                        className="p-1 text-muted hover:text-danger bg-card hover:bg-danger/10 border border-border rounded transition-colors cursor-pointer"
                                        title="Xóa Node"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Node Body (Sensors + AI Thresholds) */}
                                  {isNodeExpanded && (
                                    <div className="p-3 space-y-2.5 bg-card/20">
                                      {/* AI Vibration Thresholds Display */}
                                      <div className="flex flex-wrap items-center gap-2 p-2 bg-card2 rounded-lg border border-border/50 text-[9px]">
                                        <span className="font-bold text-muted uppercase flex items-center gap-1">
                                          <Sliders className="w-3 h-3 text-warning" />
                                          Cấu hình Rung AI:
                                        </span>
                                        <span className="font-mono text-warning bg-warning-soft px-1.5 py-0.5 rounded border border-warning-soft">
                                          Cảnh báo: ≥ {node.warnHigh ?? 2.5} mm/s
                                        </span>
                                        <span className="font-mono text-critical bg-critical-soft px-1.5 py-0.5 rounded border border-critical-soft">
                                          Nguy cấp: ≥ {node.criticalHigh ?? 25.0} mm/s
                                        </span>
                                        <span className="font-mono text-muted bg-card px-1.5 py-0.5 rounded border border-border">
                                          Lọc ảo: {node.alertMinCount ?? 4} mẫu / {node.alertMinDurationSec ?? 6.0}s
                                        </span>
                                      </div>

                                      {/* Sensors Table */}
                                      {node.sensors && node.sensors.length > 0 ? (
                                        <div className="overflow-x-auto">
                                          <table className="w-full border-collapse text-left">
                                            <thead>
                                              <tr className="border-b border-border/60 text-[8px] text-muted uppercase tracking-wider bg-card2/70">
                                                <th className="py-1.5 px-2.5">Loại Cảm Biến</th>
                                                <th className="py-1.5 px-2.5">Model Phần Cứng</th>
                                                <th className="py-1.5 px-2.5">Hiệu Chuẩn (Offset)</th>
                                                <th className="py-1.5 px-2.5">Đơn Vị</th>
                                                <th className="py-1.5 px-2.5">Trạng Thái</th>
                                                <th className="py-1.5 px-2.5 text-right">Thao Tác</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {node.sensors.map((sensor) => {
                                                const sCfg = getSensorTypeConfig(sensor.sensorType)
                                                const Icon = sCfg.icon || Activity
                                                const sSt =
                                                  SENSOR_STATUS_CONFIG[sensor.status] ||
                                                  SENSOR_STATUS_CONFIG.active

                                                return (
                                                  <tr
                                                    key={sensor.id}
                                                    className="border-b border-border/30 hover:bg-card2/40 transition-colors text-[10px]"
                                                  >
                                                    <td className="py-1.5 px-2.5">
                                                      <span className="flex items-center gap-1.5 font-semibold text-tx">
                                                        <Icon className={`w-3.5 h-3.5 ${sCfg.color}`} />
                                                        <span>{sCfg.label}</span>
                                                      </span>
                                                    </td>
                                                    <td className="py-1.5 px-2.5 font-mono text-tx">
                                                      {sensor.model || sCfg.defaultModel}
                                                    </td>
                                                    <td className="py-1.5 px-2.5 font-mono text-tx">
                                                      {sensor.calibrationOffset > 0
                                                        ? `+${sensor.calibrationOffset}`
                                                        : sensor.calibrationOffset || 0}
                                                    </td>
                                                    <td className="py-1.5 px-2.5 font-mono text-muted">
                                                      {sensor.unit || sCfg.unit}
                                                    </td>
                                                    <td className="py-1.5 px-2.5">
                                                      <span
                                                        className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold ${sSt.text}`}
                                                      >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${sSt.dot}`} />
                                                        {sSt.label}
                                                      </span>
                                                    </td>
                                                    <td className="py-1.5 px-2.5 text-right">
                                                      <button
                                                        onClick={() =>
                                                          setDeleteConfirm({
                                                            kind: 'sensor',
                                                            id: sensor.id,
                                                            name: `${sCfg.label} (${sensor.model || ''})`,
                                                            parentId: node.nodeId,
                                                          })
                                                        }
                                                        className="p-1 text-muted hover:text-danger bg-transparent border-none cursor-pointer"
                                                        title="Xóa cảm biến"
                                                      >
                                                        <Trash2 className="w-3 h-3" />
                                                      </button>
                                                    </td>
                                                  </tr>
                                                )
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-muted italic bg-card/40 border border-border/40 rounded p-2 text-center">
                                          Node này chưa có cảm biến nào.
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="text-[10px] text-muted italic bg-card/40 border border-border/50 rounded-lg p-3 text-center">
                            Chưa có Sensor Node ESP32 nào gắn vào Gateway này.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {/* Pagination */}
            {filteredGateways.length > pageSize && (
              <div className="pt-2">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={filteredGateways.length}
                  onPageChange={setPage}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* ── MODAL: CONFIRM DELETE ── */}
      <Modal
        open={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title={`Xác Nhận Xóa ${deleteConfirm?.kind?.toUpperCase()}`}
        icon={AlertTriangle}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Hủy
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleConfirmDelete}>
              Xóa Vĩnh Viễn
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-2">
          <p className="text-xs text-tx">
            Bạn có chắc chắn muốn xóa {DELETE_LABEL[deleteConfirm?.kind] || deleteConfirm?.kind}:{' '}
            <strong className="text-danger">{deleteConfirm?.name || deleteConfirm?.id}</strong> không?
          </p>
          {deleteConfirm?.kind === 'gateway' && (
            <p className="text-[11px] text-warning bg-warning/10 border border-warning/30 p-2 rounded">
              ⚠️ Cảnh báo: Việc xóa Gateway sẽ đồng thời xóa toàn bộ các Node, Cảm biến và Camera gắn kèm bên trong!
            </p>
          )}
          {deleteConfirm?.kind === 'node' && (
            <p className="text-[11px] text-warning bg-warning/10 border border-warning/30 p-2 rounded">
              ⚠️ Cảnh báo: Việc xóa Node sẽ xóa các Cảm biến trực thuộc!
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
