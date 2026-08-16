'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchGateways,
  createGateway,
  updateGateway,
  deleteGateway,
  createNode,
  updateNode,
  deleteNode,
  mapNodeCamera,
  addNodeSensor,
  updateNodeSensor,
  deleteNodeSensor,
  createCamera,
  updateCamera,
  deleteCamera,
} from '@/lib/api'
import { Mono, Panel, Badge } from '@/components/ui'
import { Field, TextInput, Select, Modal, FormActions, Button, Toast } from '@/components/form'
import { useAuth } from '@/context/AuthContext'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
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
  MapPin,
  CheckCircle2,
  Radio,
  Sliders,
  ShieldCheck,
  Zap,
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

const EMPTY_GATEWAY_FORM = {
  gatewayId: '',
  name: '',
  description: '',
  macAddress: '',
  firmwareVersion: 'L4T-r32.7.3',
  stationId: '',
}

const EMPTY_NODE_FORM = {
  nodeId: '',
  name: '',
  description: '',
  macAddress: '',
  firmwareVersion: 'v1.0.0',
  installLocation: '',
  gatewayId: '',
  warnHigh: 2.5,
  criticalHigh: 25.0,
  alertMinCount: 4,
  alertMinDurationSec: 6.0,
  episodeResetGapSec: 3.0,
}

const EMPTY_SENSOR_FORM = {
  sensorType: 'water_level',
  model: 'HC-SR04',
  unit: 'cm',
  calibrationOffset: 0,
  status: 'active',
}

const EMPTY_CAMERA_FORM = {
  cameraId: '',
  cameraType: 'CSI',
  name: '',
  streamUrl: '',
  resolution: '1280x720',
  gatewayId: '',
  status: 'active',
}

export default function StationDevicesTab({ stationId, damId, stationName, onDataChange }) {
  const { isViewer } = useAuth()
  const [gateways, setGateways] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Accordion state
  const [expandedGateways, setExpandedGateways] = useState(new Set())
  const [expandedNodes, setExpandedNodes] = useState(new Set())

  // Modals state
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState(null)
  const [nodeModalOpen, setNodeModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [sensorModalOpen, setSensorModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState(null)
  const [sensorNodeId, setSensorNodeId] = useState(null)
  const [cameraModalOpen, setCameraModalOpen] = useState(false)
  const [editingCamera, setEditingCamera] = useState(null)
  const [mapCameraModalOpen, setMapCameraModalOpen] = useState(false)
  const [mapNodeTarget, setMapNodeTarget] = useState(null)
  const [selectedCameraId, setSelectedCameraId] = useState('')

  // Delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Loading actions
  const [savingGateway, setSavingGateway] = useState(false)
  const [savingNode, setSavingNode] = useState(false)
  const [savingSensor, setSavingSensor] = useState(false)
  const [savingCamera, setSavingCamera] = useState(false)
  const [savingMapCamera, setSavingMapCamera] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Form states
  const [gatewayForm, setGatewayForm] = useState(EMPTY_GATEWAY_FORM)
  const [nodeForm, setNodeForm] = useState(EMPTY_NODE_FORM)
  const [sensorForm, setSensorForm] = useState(EMPTY_SENSOR_FORM)
  const [cameraForm, setCameraForm] = useState(EMPTY_CAMERA_FORM)

  // Toast
  const [toast, setToast] = useState(null)
  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), duration)
  }, [])

  // Load Data
  const loadData = useCallback(async (silent = false) => {
    if (!stationId) return
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await fetchGateways(stationId, damId, true)
      const list = res.gateways || []
      setGateways(list)
      // Mặc định mở rộng tất cả Gateway khi tải xong
      setExpandedGateways(new Set(list.map((g) => g.gatewayId)))
      // Mặc định mở rộng tất cả Node
      const allNodeIds = list.flatMap((g) => (g.nodes || []).map((n) => n.nodeId))
      setExpandedNodes(new Set(allNodeIds))
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [stationId, damId])

  useEffect(() => {
    loadData(false)
  }, [loadData])

  const toggleSet = (setter) => (key) => {
    setter((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }
  const toggleGateway = toggleSet(setExpandedGateways)
  const toggleNode = toggleSet(setExpandedNodes)

  // ── Tính toán thống kê nhanh tại trạm ──
  const stats = {
    totalGateways: gateways.length,
    onlineGateways: gateways.filter((g) => g.status === 'online').length,
    totalNodes: gateways.reduce((acc, g) => acc + (g.nodes?.length || 0), 0),
    onlineNodes: gateways.reduce(
      (acc, g) => acc + (g.nodes?.filter((n) => n.status === 'online')?.length || 0),
      0,
    ),
    totalCameras: gateways.reduce((acc, g) => acc + (g.cameras?.length || 0), 0),
    totalSensors: gateways.reduce(
      (acc, g) => acc + (g.nodes || []).reduce((nAcc, n) => nAcc + (n.sensors?.length || 0), 0),
      0,
    ),
  }

  // ── GATEWAY CRUD ──
  const openCreateGatewayModal = () => {
    setEditingGateway(null)
    setGatewayForm({
      ...EMPTY_GATEWAY_FORM,
      stationId: stationId,
    })
    setGatewayModalOpen(true)
  }

  const openEditGatewayModal = (gw, e) => {
    e?.stopPropagation()
    setEditingGateway(gw)
    setGatewayForm({
      gatewayId: gw.gatewayId,
      name: gw.name || '',
      description: gw.description || '',
      macAddress: gw.macAddress || '',
      firmwareVersion: gw.firmwareVersion || '',
      stationId: gw.stationId || stationId,
    })
    setGatewayModalOpen(true)
  }

  const handleSaveGateway = async () => {
    if (!gatewayForm.name?.trim()) {
      showToast('Tên Gateway không được để trống', 'error')
      return
    }
    if (!editingGateway && !gatewayForm.macAddress?.trim()) {
      showToast('Địa chỉ MAC không được để trống', 'error')
      return
    }
    try {
      setSavingGateway(true)
      if (editingGateway) {
        await updateGateway(editingGateway.gatewayId, {
          name: gatewayForm.name.trim(),
          description: gatewayForm.description?.trim() || null,
          macAddress: gatewayForm.macAddress?.trim() || undefined,
          firmwareVersion: gatewayForm.firmwareVersion?.trim() || null,
          stationId: stationId,
        })
        showToast(`Cập nhật Gateway ${editingGateway.gatewayId} thành công`)
      } else {
        await createGateway({
          gatewayId: gatewayForm.gatewayId?.trim() || undefined,
          name: gatewayForm.name.trim(),
          description: gatewayForm.description?.trim() || null,
          macAddress: gatewayForm.macAddress.trim(),
          firmwareVersion: gatewayForm.firmwareVersion?.trim() || 'L4T-r32.7.3',
          stationId: stationId,
        })
        showToast('Tạo Gateway mới thành công')
      }
      setGatewayModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingGateway(false)
    }
  }

  // ── NODE CRUD ──
  const openCreateNodeModal = (gatewayId, e) => {
    e?.stopPropagation()
    setEditingNode(null)
    setNodeForm({
      ...EMPTY_NODE_FORM,
      gatewayId: gatewayId,
    })
    setNodeModalOpen(true)
  }

  const openEditNodeModal = (node, gatewayId, e) => {
    e?.stopPropagation()
    setEditingNode(node)
    setNodeForm({
      nodeId: node.nodeId,
      name: node.name || '',
      description: node.description || '',
      macAddress: node.macAddress || '',
      firmwareVersion: node.firmwareVersion || '',
      installLocation: node.installLocation || '',
      gatewayId: gatewayId || node.gatewayId || '',
      warnHigh: node.warnHigh ?? 2.5,
      criticalHigh: node.criticalHigh ?? 25.0,
      alertMinCount: node.alertMinCount ?? 4,
      alertMinDurationSec: node.alertMinDurationSec ?? 6.0,
      episodeResetGapSec: node.episodeResetGapSec ?? 3.0,
    })
    setNodeModalOpen(true)
  }

  const handleSaveNode = async () => {
    if (!nodeForm.name?.trim()) {
      showToast('Tên Node không được để trống', 'error')
      return
    }
    if (!editingNode && !nodeForm.macAddress?.trim()) {
      showToast('Địa chỉ MAC không được để trống', 'error')
      return
    }
    try {
      setSavingNode(true)
      const payload = {
        name: nodeForm.name.trim(),
        description: nodeForm.description?.trim() || null,
        macAddress: nodeForm.macAddress?.trim() || undefined,
        firmwareVersion: nodeForm.firmwareVersion?.trim() || null,
        installLocation: nodeForm.installLocation?.trim() || null,
        gatewayId: nodeForm.gatewayId,
        warnHigh: Number(nodeForm.warnHigh) || 2.5,
        criticalHigh: Number(nodeForm.criticalHigh) || 25.0,
        alertMinCount: Number(nodeForm.alertMinCount) || 4,
        alertMinDurationSec: Number(nodeForm.alertMinDurationSec) || 6.0,
        episodeResetGapSec: Number(nodeForm.episodeResetGapSec) || 3.0,
      }
      if (editingNode) {
        await updateNode(editingNode.nodeId, payload)
        showToast(`Cập nhật Node ${editingNode.nodeId} thành công`)
      } else {
        await createNode({
          ...payload,
          nodeId: nodeForm.nodeId?.trim() || undefined,
        })
        showToast('Tạo Sensor Node mới thành công')
      }
      setNodeModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingNode(false)
    }
  }

  // ── SENSOR CRUD ──
  const openAddSensorModal = (nodeId, e) => {
    e?.stopPropagation()
    setEditingSensor(null)
    setSensorNodeId(nodeId)
    setSensorForm({ ...EMPTY_SENSOR_FORM })
    setSensorModalOpen(true)
  }

  const openEditSensorModal = (sensor, nodeId, e) => {
    e?.stopPropagation()
    setEditingSensor(sensor)
    setSensorNodeId(nodeId)
    setSensorForm({
      sensorType: sensor.sensorType || 'water_level',
      model: sensor.model || '',
      unit: sensor.unit || '',
      calibrationOffset: sensor.calibrationOffset ?? 0,
      status: sensor.status || 'active',
    })
    setSensorModalOpen(true)
  }

  const handleSaveSensor = async () => {
    if (!sensorNodeId) return
    try {
      setSavingSensor(true)
      const payload = {
        sensorType: sensorForm.sensorType,
        model: sensorForm.model?.trim() || null,
        unit: sensorForm.unit?.trim() || null,
        calibrationOffset: Number(sensorForm.calibrationOffset) || 0,
        status: sensorForm.status || 'active',
      }
      if (editingSensor) {
        await updateNodeSensor(sensorNodeId, editingSensor.id, payload)
        showToast(`Cập nhật cảm biến thành công`)
      } else {
        await addNodeSensor(sensorNodeId, payload)
        showToast(`Thêm cảm biến mới cho Node ${sensorNodeId} thành công`)
      }
      setSensorModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingSensor(false)
    }
  }

  // ── CAMERA CRUD & MAPPING ──
  const openCreateCameraModal = (gatewayId, e) => {
    e?.stopPropagation()
    setEditingCamera(null)
    setCameraForm({
      ...EMPTY_CAMERA_FORM,
      gatewayId: gatewayId,
    })
    setCameraModalOpen(true)
  }

  const openEditCameraModal = (cam, gatewayId, e) => {
    e?.stopPropagation()
    setEditingCamera(cam)
    setCameraForm({
      cameraId: cam.cameraId,
      cameraType: cam.cameraType || 'CSI',
      name: cam.name || '',
      streamUrl: cam.streamUrl || '',
      resolution: cam.resolution || '1280x720',
      gatewayId: gatewayId || cam.gatewayId || '',
      status: cam.status || 'active',
    })
    setCameraModalOpen(true)
  }

  const handleSaveCamera = async () => {
    if (!cameraForm.name?.trim()) {
      showToast('Tên Camera không được để trống', 'error')
      return
    }
    try {
      setSavingCamera(true)
      const payload = {
        cameraType: cameraForm.cameraType,
        name: cameraForm.name.trim(),
        streamUrl: cameraForm.streamUrl?.trim() || null,
        resolution: cameraForm.resolution?.trim() || '1280x720',
        gatewayId: cameraForm.gatewayId,
        status: cameraForm.status || 'active',
      }
      if (editingCamera) {
        await updateCamera(editingCamera.cameraId, payload)
        showToast(`Cập nhật Camera ${editingCamera.cameraId} thành công`)
      } else {
        await createCamera({
          ...payload,
          cameraId: cameraForm.cameraId?.trim() || undefined,
        })
        showToast('Gắn Camera mới thành công')
      }
      setCameraModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingCamera(false)
    }
  }

  const openMapCameraModal = (node, gateway, e) => {
    e?.stopPropagation()
    setMapNodeTarget(node)
    setSelectedCameraId(node.mappedCameraId || '')
    setMapCameraModalOpen(true)
  }

  const handleSaveMapCamera = async () => {
    if (!mapNodeTarget) return
    try {
      setSavingMapCamera(true)
      await mapNodeCamera(mapNodeTarget.nodeId, selectedCameraId || null)
      showToast(
        selectedCameraId
          ? `Đã gán Camera ${selectedCameraId} cho Node ${mapNodeTarget.nodeId}`
          : `Đã hủy gán Camera cho Node ${mapNodeTarget.nodeId}`,
      )
      setMapCameraModalOpen(false)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingMapCamera(false)
    }
  }

  // ── XÓA THIẾT BỊ ──
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    const { kind, id, parentId } = deleteConfirm
    try {
      setDeleting(true)
      if (kind === 'gateway') {
        await deleteGateway(id)
        showToast(`Đã xóa Gateway ${id}`)
      } else if (kind === 'node') {
        await deleteNode(id)
        showToast(`Đã xóa Node ${id}`)
      } else if (kind === 'sensor') {
        await deleteNodeSensor(parentId, id)
        showToast(`Đã xóa cảm biến khỏi Node ${parentId}`)
      } else if (kind === 'camera') {
        await deleteCamera(id)
        showToast(`Đã xóa Camera ${id}`)
      }
      setDeleteConfirm(null)
      loadData(true)
      onDataChange?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  // ── RENDER ──
  return (
    <div className="space-y-4">
      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── KPI HEADER THIẾT BỊ TẠI TRẠM ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Gateways (Jetson TX2)</span>
            <Server className="w-3.5 h-3.5 text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalGateways}</Mono>
            <span className="text-[10px] font-mono text-safe bg-safe/10 px-1.5 py-0.5 rounded border border-safe/20">
              {stats.onlineGateways} Online
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Sensor Nodes (ESP32)</span>
            <Cpu className="w-3.5 h-3.5 text-info" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalNodes}</Mono>
            <span className="text-[10px] font-mono text-info bg-info/10 px-1.5 py-0.5 rounded border border-info/20">
              {stats.onlineNodes} Online
            </span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Cảm Biến Đang Gắn</span>
            <Zap className="w-3.5 h-3.5 text-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalSensors}</Mono>
            <span className="text-[10px] text-muted">VIB, WTL, MST</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-3 shadow-panel">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Camera AI (Vết Nứt)</span>
            <Video className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <Mono className="text-xl font-bold text-tx">{stats.totalCameras}</Mono>
            <span className="text-[10px] text-muted">CSI / RTSP</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-2.5 shadow-panel">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-tx uppercase tracking-wider">
            Sơ Đồ & Danh Sách Thiết Bị Trực Thuộc Trạm
          </span>
          <span className="text-[10px] font-mono text-muted bg-card2 px-2 py-0.5 rounded-full border border-border">
            {stationName || stationId}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-muted hover:text-tx bg-card2 hover:bg-white/5 transition-colors text-[11px] font-semibold cursor-pointer"
            title="Làm mới danh sách thiết bị"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            <span>Làm mới</span>
          </button>

          {!isViewer && (
            <button
              onClick={openCreateGatewayModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-[11px] font-bold shadow-glow hover:brightness-110 transition-all cursor-pointer border-none"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Gateway (Jetson TX2)</span>
            </button>
          )}
        </div>
      </div>

      {/* ── DANH SÁCH GATEWAYS & NODES ── */}
      {loading ? (
        <div className="p-12 text-center bg-card border border-border rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
          <p className="text-xs text-muted">Đang tải cấu hình thiết bị của trạm...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-card border border-danger/30 rounded-xl">
          <AlertTriangle className="w-6 h-6 text-danger mx-auto mb-2" />
          <p className="text-xs text-danger font-semibold mb-2">Lỗi tải dữ liệu: {error}</p>
          <button
            onClick={() => loadData(false)}
            className="px-3 py-1 bg-danger/10 border border-danger/30 text-danger rounded-lg text-xs font-bold cursor-pointer hover:bg-danger/20"
          >
            Thử lại
          </button>
        </div>
      ) : gateways.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mx-auto border border-warning/30">
            <Radio className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-tx">Trạm này chưa có Gateway Jetson TX2 nào</h3>
          <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
            Để trạm có thể nhận dữ liệu từ các Sensor Node và kích hoạt AI chụp ảnh vết nứt, bạn cần lắp đặt và khai báo Gateway Jetson TX2 điều phối.
          </p>
          {!isViewer && (
            <button
              onClick={openCreateGatewayModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-xs font-bold shadow-glow hover:brightness-110 transition-all cursor-pointer border-none"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Gateway Jetson TX2 Đầu Tiên</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {gateways.map((gw) => {
            const isGwExpanded = expandedGateways.has(gw.gatewayId)
            const gwStatus = STATUS_CONFIG[gw.status] || STATUS_CONFIG.offline
            const allStationCameras = gw.cameras || []

            return (
              <div
                key={gw.gatewayId}
                className="bg-[#0b1322] border-2 border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-2xl transition-all"
              >
                {/* ── GATEWAY HEADER ROW ── */}
                <div
                  onClick={() => toggleGateway(gw.gatewayId)}
                  className="px-4 py-3.5 bg-gradient-to-r from-slate-900/90 via-[#0e172a] to-slate-900/90 hover:from-slate-800 hover:to-slate-800 border-b border-indigo-500/30 flex items-center justify-between cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white p-1 bg-transparent border-none cursor-pointer">
                      {isGwExpanded ? (
                        <ChevronDown className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-sm">
                      <Server className="w-5 h-5 text-indigo-300" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-white tracking-wide">{gw.name}</span>
                        <Mono className="text-[11px] text-indigo-300 font-bold bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 rounded-md">
                          {gw.gatewayId}
                        </Mono>
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${gwStatus.text} ${gwStatus.bg} ${gwStatus.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${gwStatus.dot}`} />
                          {gwStatus.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                        <span>
                          MAC: <strong className="text-slate-200">{gw.macAddress || '—'}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Firmware: <strong className="text-slate-200">{gw.firmwareVersion || '—'}</strong>
                        </span>
                        {gw.lastSeenAt && (
                          <>
                            <span>•</span>
                            <span>
                              Cập nhật:{' '}
                              <strong className="text-slate-200">
                                {new Date(gw.lastSeenAt).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for Gateway */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!isViewer && (
                      <>
                        <button
                          onClick={(e) => openCreateNodeModal(gw.gatewayId, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer border-none"
                          title="Thêm Sensor Node ESP32 vào Gateway này"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm Node</span>
                        </button>

                        <button
                          onClick={(e) => openCreateCameraModal(gw.gatewayId, e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer border-none"
                          title="Gắn Camera CSI/RTSP vào Gateway này"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Gắn Camera</span>
                        </button>

                        <button
                          onClick={(e) => openEditGatewayModal(gw, e)}
                          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Sửa thông tin Gateway"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm({
                              kind: 'gateway',
                              id: gw.gatewayId,
                              name: gw.name,
                            })
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/60 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Xóa Gateway"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── GATEWAY CONTENT (EXPANDABLE) ── */}
                {isGwExpanded && (
                  <div className="p-4 space-y-5 bg-[#080e1a]">
                    {/* SECTION 1: CAMERAS GẮN VÀO GATEWAY */}
                    <div className="bg-[#0c1e1c]/60 border border-emerald-500/25 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-emerald-400" />
                            Camera Giám Sát AI Trực Thuộc
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            {gw.cameras?.length || 0}
                          </span>
                        </div>
                      </div>

                      {gw.cameras && gw.cameras.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {gw.cameras.map((cam) => {
                            const camSt = CAMERA_STATUS_CONFIG[cam.status] || CAMERA_STATUS_CONFIG.active
                            return (
                              <div
                                key={cam.cameraId}
                                className="bg-[#0d2623] border border-emerald-500/35 hover:border-emerald-500/60 rounded-xl p-3 flex items-start justify-between shadow-md transition-all"
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                                    <CameraIcon className="w-4 h-4 text-emerald-300" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-white truncate">{cam.name}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <Mono className="text-[10px] text-emerald-300 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                        {cam.cameraId}
                                      </Mono>
                                      <span className="text-[9px] font-semibold text-emerald-200/90">({cam.cameraType || 'CSI'})</span>
                                      <span className="text-[9px] font-mono text-slate-300">{cam.resolution}</span>
                                    </div>
                                    {cam.streamUrl && (
                                      <div className="text-[9px] font-mono text-emerald-300/90 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/20 truncate max-w-[200px] mt-1" title={cam.streamUrl}>
                                        {cam.streamUrl}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {!isViewer && (
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      onClick={() => openEditCameraModal(cam, gw.gatewayId)}
                                      className="p-1.5 text-slate-300 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/30 rounded-lg cursor-pointer transition-colors"
                                      title="Sửa Camera"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteConfirm({
                                          kind: 'camera',
                                          id: cam.cameraId,
                                          name: cam.name,
                                        })
                                      }
                                      className="p-1.5 text-slate-300 hover:text-rose-300 bg-emerald-950/60 hover:bg-rose-950/80 border border-emerald-500/30 rounded-lg cursor-pointer transition-colors"
                                      title="Xóa Camera"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-400/80 bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 text-center">
                          Chưa có Camera nào gắn vào Gateway này. (Bấm nút <strong>"+ Gắn Camera"</strong> ở trên để thêm)
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: SENSOR NODES (ESP32) */}
                    <div className="bg-[#091526]/80 border border-sky-500/25 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                          <span className="text-xs font-extrabold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-sky-400" />
                            Danh Sách Sensor Nodes ESP32
                          </span>
                          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                            {gw.nodes?.length || 0}
                          </span>
                        </div>
                      </div>

                      {gw.nodes && gw.nodes.length > 0 ? (
                        <div className="space-y-4">
                          {gw.nodes.map((node) => {
                            const isNodeExpanded = expandedNodes.has(node.nodeId)
                            const nodeSt = STATUS_CONFIG[node.status] || STATUS_CONFIG.offline
                            const mappedCam = allStationCameras.find(
                              (c) => c.cameraId === node.mappedCameraId,
                            )

                            return (
                              <div
                                key={node.nodeId}
                                className="bg-[#0b1626] border-2 border-sky-500/30 hover:border-sky-500/50 rounded-xl overflow-hidden shadow-lg transition-all"
                              >
                                {/* Node header */}
                                <div
                                  onClick={() => toggleNode(node.nodeId)}
                                  className="px-4 py-3 bg-gradient-to-r from-[#11213b] via-[#142847] to-[#11213b] hover:from-[#172e52] hover:to-[#172e52] border-b border-sky-500/25 flex items-center justify-between cursor-pointer select-none transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <button className="text-slate-400 hover:text-white p-0.5 bg-transparent border-none cursor-pointer">
                                      {isNodeExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-sky-400" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4" />
                                      )}
                                    </button>

                                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 shadow-sm">
                                      <Cpu className="w-4 h-4 text-sky-300" />
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-extrabold text-white tracking-wide">{node.name}</span>
                                        <Mono className="text-[10px] text-sky-300 font-bold bg-sky-500/20 border border-sky-500/40 px-2 py-0.2 rounded">
                                          {node.nodeId}
                                        </Mono>
                                        <span
                                          className={`inline-flex items-center gap-1 text-[8px] font-mono font-bold px-2 py-0.2 rounded-full border ${nodeSt.text} ${nodeSt.bg} ${nodeSt.border}`}
                                        >
                                          <span className={`w-1 h-1 rounded-full ${nodeSt.dot}`} />
                                          {nodeSt.label}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono mt-0.5">
                                        <span>
                                          Vị trí: <strong className="text-slate-200">{node.installLocation || 'Thân đập'}</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          MAC: <strong className="text-slate-200">{node.macAddress || '—'}</strong>
                                        </span>
                                        <span>•</span>
                                        <span>
                                          Firmware: <strong className="text-slate-200">{node.firmwareVersion || 'v1.0'}</strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Node Quick Actions */}
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    {/* Mapped Camera Badge / Button */}
                                    <button
                                      onClick={(e) => openMapCameraModal(node, gw, e)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${mappedCam
                                          ? 'bg-purple-950/80 text-purple-300 border-purple-500/50 hover:bg-purple-900 shadow-sm'
                                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                        }`}
                                      title="Cấu hình Camera AI chụp ảnh khi Node này rung bất thường"
                                    >
                                      <CameraIcon className="w-3 h-3 text-purple-400" />
                                      <span>
                                        {mappedCam ? `Cam AI: ${mappedCam.name || mappedCam.cameraId}` : 'Chưa gán Cam AI'}
                                      </span>
                                    </button>

                                    {!isViewer && (
                                      <>
                                        <button
                                          onClick={(e) => openAddSensorModal(node.nodeId, e)}
                                          className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer border-none"
                                          title="Thêm cảm biến (Rung, Mực nước, Độ ẩm) cho Node này"
                                        >
                                          <Plus className="w-3 h-3" />
                                          <span>Thêm Sensor</span>
                                        </button>

                                        <button
                                          onClick={(e) => openEditNodeModal(node, gw.gatewayId, e)}
                                          className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                                          title="Sửa thông tin Node"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setDeleteConfirm({
                                              kind: 'node',
                                              id: node.nodeId,
                                              name: node.name,
                                              parentId: gw.gatewayId,
                                            })
                                          }}
                                          className="p-1.5 text-slate-300 hover:text-rose-300 bg-slate-800 hover:bg-rose-950/80 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                                          title="Xóa Node"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Node Body (Sensors + Thresholds Config) */}
                                {isNodeExpanded && (
                                  <div className="p-3.5 space-y-3 bg-[#070e1a]">
                                    {/* AI Vibration Thresholds Summary */}
                                    <div className="flex flex-wrap items-center gap-2.5 p-2.5 bg-[#0d1726] rounded-xl border border-slate-700/80 text-[10px]">
                                      <span className="font-extrabold text-amber-400 uppercase flex items-center gap-1.5 tracking-wide">
                                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                                        Ngưỡng Rung AI:
                                      </span>
                                      <span className="font-mono text-amber-300 font-bold bg-amber-500/20 px-2.5 py-0.5 rounded-md border border-amber-500/40">
                                        Cảnh báo: ≥ {node.warnHigh ?? 2.5} mm/s
                                      </span>
                                      <span className="font-mono text-rose-300 font-bold bg-rose-500/20 px-2.5 py-0.5 rounded-md border border-rose-500/40">
                                        Nguy cấp: ≥ {node.criticalHigh ?? 25.0} mm/s
                                      </span>
                                      <span className="font-mono text-sky-300 font-bold bg-sky-500/20 px-2.5 py-0.5 rounded-md border border-sky-500/40">
                                        Bộ lọc lọc ảo: {node.alertMinCount ?? 4} mẫu / {node.alertMinDurationSec ?? 3.0}s
                                      </span>
                                    </div>

                                    {/* Sensors Table */}
                                    {node.sensors && node.sensors.length > 0 ? (
                                      <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-[#070e1a]">
                                        <table className="w-full border-collapse text-left">
                                          <thead>
                                            <tr className="border-b border-slate-700 text-[9px] text-slate-300 font-bold uppercase tracking-wider bg-[#131f33]">
                                              <th className="py-2 px-3">Loại Cảm Biến</th>
                                              <th className="py-2 px-3">Model Phần Cứng</th>
                                              <th className="py-2 px-3">Hiệu Chuẩn (Offset)</th>
                                              <th className="py-2 px-3">Đơn Vị</th>
                                              <th className="py-2 px-3">Trạng Thái</th>
                                              {!isViewer && <th className="py-2 px-3 text-right">Thao Tác</th>}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {node.sensors.map((sensor) => {
                                              const sCfg = getSensorTypeConfig(sensor.sensorType)
                                              const Icon = sCfg.icon || Activity
                                              const sSt = SENSOR_STATUS_CONFIG[sensor.status] || SENSOR_STATUS_CONFIG.active

                                              return (
                                                <tr
                                                  key={sensor.id}
                                                  className="border-b border-slate-800/80 odd:bg-[#070e1a] even:bg-[#0b1424] hover:bg-slate-800/50 transition-colors text-[11px]"
                                                >
                                                  <td className="py-2 px-3">
                                                    <span className="flex items-center gap-2 font-bold text-white">
                                                      <Icon className={`w-4 h-4 ${sCfg.color}`} />
                                                      <span>{sCfg.label}</span>
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3 font-mono font-semibold text-slate-200">
                                                    <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/80">
                                                      {sensor.model || sCfg.defaultModel}
                                                    </span>
                                                  </td>
                                                  <td className="py-2 px-3 font-mono font-bold text-cyan-300">
                                                    {sensor.calibrationOffset > 0 ? `+${sensor.calibrationOffset}` : sensor.calibrationOffset || 0}
                                                  </td>
                                                  <td className="py-2 px-3 font-mono font-semibold text-slate-300">
                                                    {sensor.unit || sCfg.unit}
                                                  </td>
                                                  <td className="py-2 px-3">
                                                    <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30`}>
                                                      <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse`} />
                                                      {sSt.label}
                                                    </span>
                                                  </td>
                                                  {!isViewer && (
                                                    <td className="py-2 px-3 text-right">
                                                      <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                          onClick={() => openEditSensorModal(sensor, node.nodeId)}
                                                          className="p-1.5 text-slate-400 hover:text-sky-300 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                                                          title="Sửa cảm biến"
                                                        >
                                                          <Pencil className="w-3 h-3" />
                                                        </button>
                                                        <button
                                                          onClick={() =>
                                                            setDeleteConfirm({
                                                              kind: 'sensor',
                                                              id: sensor.id,
                                                              name: `${sCfg.label} (${sensor.model || ''})`,
                                                              parentId: node.nodeId,
                                                            })
                                                          }
                                                          className="p-1.5 text-slate-400 hover:text-rose-300 bg-slate-800/80 hover:bg-rose-950/80 rounded-lg border border-slate-700 cursor-pointer transition-colors"
                                                          title="Xóa cảm biến"
                                                        >
                                                          <Trash2 className="w-3 h-3" />
                                                        </button>
                                                      </div>
                                                    </td>
                                                  )}
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
                                        Node này chưa có cảm biến nào. (Bấm nút <strong>"+ Thêm Sensor"</strong> ở trên để khai báo cảm biến Rung/Mực nước/Độ ẩm)
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-[11px] text-sky-400/80 bg-sky-950/30 border border-sky-500/20 rounded-xl p-3 text-center">
                          Chưa có Sensor Node ESP32 nào gắn vào Gateway này. (Bấm nút <strong>"+ Thêm Node"</strong> ở trên để tạo)
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT GATEWAY ── */}
      <Modal
        open={gatewayModalOpen}
        onClose={() => setGatewayModalOpen(false)}
        title={editingGateway ? `Sửa Gateway ${editingGateway.gatewayId}` : 'Thêm Gateway Mới (Jetson TX2)'}
        icon={Server}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setGatewayModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingGateway} onClick={handleSaveGateway}>
              {editingGateway ? 'Lưu Thay Đổi' : 'Tạo Gateway'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Tên Gateway" required htmlFor="gw-name">
            <TextInput
              id="gw-name"
              required
              autoFocus
              value={gatewayForm.name}
              onChange={(e) => setGatewayForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="vd: Gateway Trạm Tân Ấp (Jetson TX2)"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Mã Gateway (Định danh)" htmlFor="gw-id" hint="Tự sinh nếu để trống">
              <TextInput
                id="gw-id"
                disabled={Boolean(editingGateway)}
                value={gatewayForm.gatewayId}
                onChange={(e) => setGatewayForm((p) => ({ ...p, gatewayId: e.target.value }))}
                placeholder="vd: GTW-ST01-TX2A"
                className="font-mono uppercase"
              />
            </Field>

            <Field label="Địa chỉ MAC" required htmlFor="gw-mac">
              <TextInput
                id="gw-mac"
                required
                value={gatewayForm.macAddress}
                onChange={(e) => setGatewayForm((p) => ({ ...p, macAddress: e.target.value }))}
                placeholder="vd: 00:04:4B:XX:XX:XX"
                className="font-mono uppercase"
              />
            </Field>
          </div>

          <Field label="Firmware Version" htmlFor="gw-fw">
            <TextInput
              id="gw-fw"
              value={gatewayForm.firmwareVersion}
              onChange={(e) => setGatewayForm((p) => ({ ...p, firmwareVersion: e.target.value }))}
              placeholder="vd: L4T-r32.7.3"
              className="font-mono"
            />
          </Field>

          <Field label="Mô tả ghi chú" htmlFor="gw-desc">
            <TextInput
              id="gw-desc"
              value={gatewayForm.description}
              onChange={(e) => setGatewayForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="vd: Đặt tại tủ điều khiển trung tâm trạm"
            />
          </Field>
        </div>
      </Modal>

      {/* ── MODAL: CREATE / EDIT NODE ── */}
      <Modal
        open={nodeModalOpen}
        onClose={() => setNodeModalOpen(false)}
        title={editingNode ? `Sửa Sensor Node ${editingNode.nodeId}` : 'Thêm Sensor Node Mới (ESP32)'}
        icon={Cpu}
        maxWidth="max-w-2xl"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setNodeModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingNode} onClick={handleSaveNode}>
              {editingNode ? 'Lưu Thay Đổi' : 'Tạo Node'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Tên Node" required htmlFor="node-name">
            <TextInput
              id="node-name"
              required
              autoFocus
              value={nodeForm.name}
              onChange={(e) => setNodeForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="vd: Node Cảm Biến Thân Đập Khối 01"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Mã Node" htmlFor="node-id" hint="Tự sinh nếu để trống">
              <TextInput
                id="node-id"
                disabled={Boolean(editingNode)}
                value={nodeForm.nodeId}
                onChange={(e) => setNodeForm((p) => ({ ...p, nodeId: e.target.value }))}
                placeholder="vd: NOD-GW01-ESP01"
                className="font-mono uppercase"
              />
            </Field>

            <Field label="Địa chỉ MAC" required htmlFor="node-mac">
              <TextInput
                id="node-mac"
                required
                value={nodeForm.macAddress}
                onChange={(e) => setNodeForm((p) => ({ ...p, macAddress: e.target.value }))}
                placeholder="vd: 24:0A:C4:XX:XX:XX"
                className="font-mono uppercase"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Vị trí lắp đặt chi tiết" htmlFor="node-loc">
              <TextInput
                id="node-loc"
                value={nodeForm.installLocation}
                onChange={(e) => setNodeForm((p) => ({ ...p, installLocation: e.target.value }))}
                placeholder="vd: Thân đập chính K25+500"
              />
            </Field>

            <Field label="Firmware" htmlFor="node-fw">
              <TextInput
                id="node-fw"
                value={nodeForm.firmwareVersion}
                onChange={(e) => setNodeForm((p) => ({ ...p, firmwareVersion: e.target.value }))}
                placeholder="vd: v1.0.0"
                className="font-mono"
              />
            </Field>
          </div>

          {/* Cấu hình ngưỡng rung AI */}
          <div className="p-3 bg-card2/80 border border-border/80 rounded-xl space-y-2.5">
            <div className="text-[11px] font-bold text-warning uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Cấu hình phát hiện rung động AI (Đồng bộ xuống Jetson TX2)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Ngưỡng Cảnh Báo (mm/s)" htmlFor="node-warn">
                <TextInput
                  id="node-warn"
                  type="number"
                  step="0.1"
                  value={nodeForm.warnHigh}
                  onChange={(e) => setNodeForm((p) => ({ ...p, warnHigh: e.target.value }))}
                  className="font-mono"
                />
              </Field>

              <Field label="Ngưỡng Nguy Cấp (mm/s)" htmlFor="node-crit">
                <TextInput
                  id="node-crit"
                  type="number"
                  step="0.1"
                  value={nodeForm.criticalHigh}
                  onChange={(e) => setNodeForm((p) => ({ ...p, criticalHigh: e.target.value }))}
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Số mẫu vượt ngưỡng tối thiểu (minCount)" htmlFor="node-count">
                <TextInput
                  id="node-count"
                  type="number"
                  value={nodeForm.alertMinCount}
                  onChange={(e) => setNodeForm((p) => ({ ...p, alertMinCount: e.target.value }))}
                  className="font-mono"
                />
              </Field>

              <Field label="Thời gian duy trì tối thiểu (giây)" htmlFor="node-dur">
                <TextInput
                  id="node-dur"
                  type="number"
                  step="0.5"
                  value={nodeForm.alertMinDurationSec}
                  onChange={(e) => setNodeForm((p) => ({ ...p, alertMinDurationSec: e.target.value }))}
                  className="font-mono"
                />
              </Field>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: ADD / EDIT SENSOR ── */}
      <Modal
        open={sensorModalOpen}
        onClose={() => setSensorModalOpen(false)}
        title={editingSensor ? `Sửa Cảm Biến` : `Thêm Cảm Biến cho Node ${sensorNodeId}`}
        icon={Zap}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setSensorModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingSensor} onClick={handleSaveSensor}>
              {editingSensor ? 'Lưu Cảm Biến' : 'Thêm Cảm Biến'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Loại Cảm Biến" required htmlFor="sensor-type">
            <Select
              id="sensor-type"
              value={sensorForm.sensorType}
              onChange={(e) => {
                const val = e.target.value
                const cfg = getSensorTypeConfig(val)
                setSensorForm((p) => ({
                  ...p,
                  sensorType: val,
                  model: cfg.defaultModel || p.model,
                  unit: cfg.unit || p.unit,
                }))
              }}
            >
              <option value="water_level">Mực nước (Water Level - HC-SR04/Áp suất)</option>
              <option value="vibration">Độ rung thân đập (Vibration - MPU6050)</option>
              <option value="moisture">Độ ẩm rò rỉ (Moisture - DHT22/Capacitive)</option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Model Phần Cứng" htmlFor="sensor-model">
              <TextInput
                id="sensor-model"
                value={sensorForm.model}
                onChange={(e) => setSensorForm((p) => ({ ...p, model: e.target.value }))}
                placeholder="vd: MPU6050, HC-SR04"
                className="font-mono"
              />
            </Field>

            <Field label="Đơn vị đo" htmlFor="sensor-unit">
              <TextInput
                id="sensor-unit"
                value={sensorForm.unit}
                onChange={(e) => setSensorForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="vd: mm/s, m, %"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Hiệu chuẩn Offset" htmlFor="sensor-offset" hint="Cộng/trừ bù sai số">
              <TextInput
                id="sensor-offset"
                type="number"
                step="0.01"
                value={sensorForm.calibrationOffset}
                onChange={(e) => setSensorForm((p) => ({ ...p, calibrationOffset: e.target.value }))}
                className="font-mono"
              />
            </Field>

            <Field label="Trạng thái" htmlFor="sensor-status">
              <Select
                id="sensor-status"
                value={sensorForm.status}
                onChange={(e) => setSensorForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Tạm dừng (Inactive)</option>
                <option value="faulty">Lỗi hỏng (Faulty)</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: CREATE / EDIT CAMERA ── */}
      <Modal
        open={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        title={editingCamera ? `Sửa Camera ${editingCamera.cameraId}` : 'Gắn Camera Mới vào Gateway'}
        icon={Video}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setCameraModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingCamera} onClick={handleSaveCamera}>
              {editingCamera ? 'Lưu Camera' : 'Gắn Camera'}
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <Field label="Tên Camera" required htmlFor="cam-name">
            <TextInput
              id="cam-name"
              required
              autoFocus
              value={cameraForm.name}
              onChange={(e) => setCameraForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="vd: Camera Quan Sát Khối 01 (CSI Sony IMX219)"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Mã Camera" htmlFor="cam-id" hint="Tự sinh nếu để trống">
              <TextInput
                id="cam-id"
                disabled={Boolean(editingCamera)}
                value={cameraForm.cameraId}
                onChange={(e) => setCameraForm((p) => ({ ...p, cameraId: e.target.value }))}
                placeholder="vd: CAM-CSI-ST01-01"
                className="font-mono uppercase"
              />
            </Field>

            <Field label="Loại Camera" htmlFor="cam-type">
              <Select
                id="cam-type"
                value={cameraForm.cameraType}
                onChange={(e) => setCameraForm((p) => ({ ...p, cameraType: e.target.value }))}
              >
                <option value="CSI">CSI (Gắn trực tiếp Jetson TX2)</option>
                <option value="RTSP">RTSP (Camera IP luồng mạng)</option>
                <option value="USB">USB Camera</option>
              </Select>
            </Field>
          </div>

          <Field label="Đường dẫn Stream / RTSP / Pipeline" htmlFor="cam-url">
            <TextInput
              id="cam-url"
              value={cameraForm.streamUrl}
              onChange={(e) => setCameraForm((p) => ({ ...p, streamUrl: e.target.value }))}
              placeholder="vd: rtsp://192.168.1.100:554/live hoặc /dev/video0"
              className="font-mono text-xs"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Độ phân giải" htmlFor="cam-res">
              <Select
                id="cam-res"
                value={cameraForm.resolution}
                onChange={(e) => setCameraForm((p) => ({ ...p, resolution: e.target.value }))}
              >
                <option value="1280x720">1280x720 (HD 720p)</option>
                <option value="1920x1080">1920x1080 (Full HD 1080p)</option>
                <option value="640x480">640x480 (VGA)</option>
              </Select>
            </Field>

            <Field label="Trạng thái" htmlFor="cam-status">
              <Select
                id="cam-status"
                value={cameraForm.status}
                onChange={(e) => setCameraForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="active">Hoạt động (Active)</option>
                <option value="inactive">Tạm dừng (Inactive)</option>
                <option value="error">Lỗi kết nối (Error)</option>
              </Select>
            </Field>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: MAP CAMERA TO NODE ── */}
      <Modal
        open={mapCameraModalOpen}
        onClose={() => setMapCameraModalOpen(false)}
        title={`Gán Camera AI Chụp Ảnh cho Node ${mapNodeTarget?.nodeId}`}
        icon={CameraIcon}
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setMapCameraModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={savingMapCamera} onClick={handleSaveMapCamera}>
              Lưu Ánh Xạ
            </Button>
          </FormActions>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted leading-relaxed">
            Khi Node <strong className="text-info font-mono">{mapNodeTarget?.nodeId}</strong> phát hiện rung lắc vượt ngưỡng, Jetson TX2 sẽ tự động chụp ảnh từ camera được chọn dưới đây và chạy mô hình AI nhận diện vết nứt.
          </p>

          <Field label="Chọn Camera Giám Sát" htmlFor="map-cam-select">
            <Select
              id="map-cam-select"
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
            >
              <option value="">-- Không gán Camera (Hủy mapping) --</option>
              {gateways
                .flatMap((g) => g.cameras || [])
                .map((c) => (
                  <option key={c.cameraId} value={c.cameraId}>
                    {c.name} ({c.cameraId}) — {c.cameraType}
                  </option>
                ))}
            </Select>
          </Field>
        </div>
      </Modal>

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
            Bạn có chắc chắn muốn xóa {deleteConfirm?.kind}:{' '}
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
