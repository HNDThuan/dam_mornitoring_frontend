'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchNodes,
  fetchDams,
  fetchStations,
  createNode,
  updateNode,
  deleteNode,
  addNodeSensor,
  updateNodeSensor,
  deleteNodeSensor,
  fetchThresholdConfigs,
  updateThresholdConfig,
} from '@/lib/api'
import { Mono, Panel, StatTile } from '@/components/ui'
import { Field, TextInput, Select, Modal, FormActions, Button, Toast } from '@/components/form'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Plus,
  Pencil,
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
  ExternalLink,
  MapPin,
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

export default function NodesPage() {
  const { user, isAdmin, isOperator, isViewer, assignedDamId } = useAuth()
  const [nodes, setNodes] = useState([])
  const [dams, setDams] = useState([])
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [search, setSearch] = useState('')
  const [filterDamId, setFilterDamId] = useState('')
  const [filterStationId, setFilterStationId] = useState('')

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState(new Set())

  // Modals
  const [nodeModalOpen, setNodeModalOpen] = useState(false)
  const [editingNode, setEditingNode] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [sensorModalOpen, setSensorModalOpen] = useState(false)
  const [editingSensor, setEditingSensor] = useState(null)
  const [sensorNodeId, setSensorNodeId] = useState(null)

  // Saving / deleting states (for Button loading spinners)
  const [savingNode, setSavingNode] = useState(false)
  const [savingSensor, setSavingSensor] = useState(false)
  const [deletingNode, setDeletingNode] = useState(false)

  // Toast State
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Node form
  const [nodeForm, setNodeForm] = useState({
    id: '', name: '', description: '', macAddress: '', firmwareVersion: '', installLocation: '', stationId: '',
  })

  // Sensor form
  const [sensorForm, setSensorForm] = useState({
    sensorType: 'water_level', model: '', unit: '', calibrationOffset: 0, status: 'active',
  })

  // Fetch data
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const activeDam = isOperator && assignedDamId ? assignedDamId : (filterDamId || undefined)
      const [nodesRes, damsRes, stationsRes] = await Promise.all([
        fetchNodes(undefined, filterStationId ? Number(filterStationId) : undefined, activeDam),
        fetchDams(),
        fetchStations(activeDam),
      ])

      let allNodes = nodesRes.nodes || []
      let allDams = damsRes.dams || []
      let allStations = stationsRes.stations || []

      // Scope strictly to assigned dam for operators (read endpoints aren't sent an auth token,
      // so the backend can't apply @CurrentUser scoping here — enforce it client-side too)
      if (isOperator && assignedDamId) {
        allDams = allDams.filter(d => d.id === assignedDamId)
        allStations = allStations.filter(s => s.damId === assignedDamId)
        allNodes = allNodes.filter(n => n.gateway?.station?.damId === assignedDamId)
      }

      setNodes(allNodes)
      setDams(allDams)
      setStations(allStations)
    } catch (err) {
      setError(err.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filterDamId, filterStationId, isOperator, assignedDamId])

  useEffect(() => { loadData(false) }, [loadData])

  // Filter stations by selected dam
  const filteredStations = (isOperator && assignedDamId)
    ? stations.filter(s => s.damId === assignedDamId)
    : filterDamId
      ? stations.filter(s => s.damId === filterDamId)
      : stations

  // Filter nodes by search
  const filteredNodes = nodes.filter(n => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      n.name.toLowerCase().includes(q) ||
      n.id.toLowerCase().includes(q) ||
      (n.macAddress && n.macAddress.toLowerCase().includes(q)) ||
      (n.installLocation && n.installLocation.toLowerCase().includes(q))
    )
  })

  // Toggle expanded row
  const toggleExpanded = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Node CRUD ──
  const openCreateNodeModal = () => {
    setEditingNode(null)
    setNodeForm({
      id: '',
      name: '',
      description: '',
      macAddress: '',
      firmwareVersion: 'v1.0.0',
      installLocation: '',
      stationId: filteredStations[0]?.id || stations[0]?.id || '',
      vibrationThreshold: 15.0,
      warnHigh: 2.5,
      criticalHigh: 25.0,
      alertMinCount: 4,
      alertMinDurationSec: 6.0,
    })
    setNodeModalOpen(true)
  }

  const openEditNodeModal = (node, e) => {
    e?.stopPropagation()
    setEditingNode(node)
    setNodeForm({
      id: node.id,
      name: node.name || '',
      description: node.description || '',
      macAddress: node.macAddress || '',
      firmwareVersion: node.firmwareVersion || '',
      installLocation: node.installLocation || '',
      stationId: node.gateway?.stationId || '',
      vibrationThreshold: node.vibrationThreshold ?? 15.0,
      warnHigh: node.warnHigh ?? 2.5,
      criticalHigh: node.criticalHigh ?? 25.0,
      alertMinCount: node.alertMinCount ?? 4,
      alertMinDurationSec: node.alertMinDurationSec ?? 6.0,
    })
    setNodeModalOpen(true)
  }

  const handleSaveNode = async (e) => {
    e.preventDefault()
    try {
      setSavingNode(true)
      const payload = {
        name: nodeForm.name,
        description: nodeForm.description,
        macAddress: nodeForm.macAddress,
        firmwareVersion: nodeForm.firmwareVersion,
        installLocation: nodeForm.installLocation,
        stationId: nodeForm.stationId ? Number(nodeForm.stationId) : undefined,
        vibrationThreshold: Number(nodeForm.vibrationThreshold),
        warnHigh: Number(nodeForm.warnHigh),
        criticalHigh: Number(nodeForm.criticalHigh),
        alertMinCount: Number(nodeForm.alertMinCount),
        alertMinDurationSec: Number(nodeForm.alertMinDurationSec),
      }
      if (editingNode) {
        await updateNode(editingNode.id, payload)

        // Đồng bộ 2 chiều: Cập nhật luôn ThresholdConfig của Đập chứa Station này
        const targetStation = stations.find(s => String(s.id) === String(payload.stationId || editingNode.gateway?.stationId))
        if (targetStation?.damId) {
          try {
            const res = await fetchThresholdConfigs(targetStation.damId)
            const configs = res?.configs || []
            const vibCfg = configs.find(c => c.sensorType === 'vibration')
            if (vibCfg) {
              await updateThresholdConfig(vibCfg.id, {
                warnHigh: payload.warnHigh,
                alertHigh: payload.vibrationThreshold,
                criticalHigh: payload.criticalHigh,
              })
            }
          } catch (e) {
            console.warn('[Nodes] Không thể đồng bộ ngược ThresholdConfig:', e)
          }
        }

        showToast('Cập nhật Node & đồng bộ 2 chiều với Đập/Trạm & Node thành công!', 'success')
      } else {
        const res = await createNode(payload)
        showToast(`Tạo node thành công! (Mã: ${res?.node?.id || ''})`, 'success')
      }
      setNodeModalOpen(false)
      loadData(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingNode(false)
    }
  }

  const handleDeleteNode = async () => {
    if (!deleteConfirm) return
    try {
      setDeletingNode(true)
      await deleteNode(deleteConfirm.id)
      showToast(`Đã xóa Sensor Node ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      loadData(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeletingNode(false)
    }
  }

  // ── Sensor CRUD ──
  const openAddSensorModal = (nodeId, e) => {
    e?.stopPropagation()
    setEditingSensor(null)
    setSensorNodeId(nodeId)
    setSensorForm({ sensorType: 'water_level', model: 'HC-SR04', unit: 'cm', calibrationOffset: 0, status: 'active' })
    setSensorModalOpen(true)
  }

  const openEditSensorModal = (nodeId, sensor, e) => {
    e?.stopPropagation()
    setEditingSensor(sensor)
    setSensorNodeId(nodeId)
    setSensorForm({
      sensorType: sensor.sensorType || 'water_level',
      model: sensor.model || '',
      unit: sensor.unit || '',
      calibrationOffset: sensor.calibrationOffset || 0,
      status: sensor.status || 'active',
    })
    setSensorModalOpen(true)
  }

  const handleSaveSensor = async (e) => {
    e.preventDefault()
    try {
      setSavingSensor(true)
      if (editingSensor) {
        await updateNodeSensor(sensorNodeId, editingSensor.id, sensorForm)
        showToast('Cập nhật cảm biến thành công!', 'success')
      } else {
        await addNodeSensor(sensorNodeId, sensorForm)
        showToast('Thêm cảm biến vào Sensor Node thành công!', 'success')
      }
      setSensorModalOpen(false)
      loadData(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingSensor(false)
    }
  }

  const handleDeleteSensor = async (nodeId, sensorId) => {
    if (!confirm('Xóa cảm biến này?')) return
    try {
      await deleteNodeSensor(nodeId, sensorId)
      showToast('Đã xóa cảm biến!', 'success')
      loadData(true)
    } catch (err) {
      showToast(`Lỗi khi xóa cảm biến: ${err.message}`, 'error')
    }
  }

  // Helper: find station name
  const getStationName = (stationId) => {
    const st = stations.find(s => s.id === stationId)
    return st ? st.name : `Station #${stationId}`
  }

  // Helper: find dam name for station
  const getDamName = (stationId) => {
    const st = stations.find(s => s.id === stationId)
    if (!st) return '—'
    const dam = dams.find(d => d.id === st.damId)
    return dam ? dam.name : st.damId
  }

  // Helper: format time ago
  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Chưa kết nối'
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 60000) return `${Math.floor(diff / 1000)}s trước`
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
    return `${Math.floor(diff / 86400000)} ngày trước`
  }

  // Stats
  const onlineCount = nodes.filter(n => n.status === 'online').length
  const offlineCount = nodes.filter(n => n.status === 'offline').length
  const errorCount = nodes.filter(n => n.status === 'error').length

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-panel">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-tx tracking-wide m-0">Quản lý Sensor Node</h1>
          </div>
          <p className="text-[10px] text-muted m-0">Quản lý thiết bị IoT ESP32 Node + các cảm biến mực nước, độ ẩm, độ rung cho từng trạm</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Filter by Dam (Locked to assigned dam for operators) */}
          {isOperator && assignedDamId ? (
            <div className="h-9 flex items-center gap-1.5 px-3 bg-accent/10 border border-accent/30 rounded-lg text-accent text-[11px] font-bold shrink-0 whitespace-nowrap">
              <MapPin className="w-3.5 h-3.5" />
              <span>{dams.find(d => d.id === assignedDamId)?.name || `Đập ${assignedDamId}`}</span>
            </div>
          ) : (
            <select
              value={filterDamId}
              onChange={e => { setFilterDamId(e.target.value); setFilterStationId('') }}
              className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] focus-visible:outline-none focus:border-accent shrink-0 cursor-pointer"
            >
              <option value="">Tất cả đập</option>
              {dams.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          {/* Filter by Station */}
          <select
            value={filterStationId}
            onChange={e => setFilterStationId(e.target.value)}
            className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] focus-visible:outline-none focus:border-accent shrink-0 cursor-pointer"
          >
            <option value="">Tất cả trạm</option>
            {filteredStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Search */}
          <div className="h-9 flex items-center gap-2 bg-card2 border border-border rounded-lg px-3 w-56 shrink-0 focus-within:border-accent">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm Sensor Node..."
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={loadData}
            className="h-9 flex items-center gap-1.5 px-3.5 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          {!isViewer && (
            <button
              onClick={openCreateNodeModal}
              className="h-9 flex items-center gap-1.5 px-4 bg-accent hover:bg-accent/90 rounded-md text-white text-[11px] font-bold cursor-pointer border-none shrink-0 whitespace-nowrap transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sensor Node</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={Server} label="Tổng Node" value={nodes.length} status="info" />
        <StatTile icon={Wifi} label="Online" value={onlineCount} status="safe" />
        <StatTile icon={WifiOff} label="Offline" value={offlineCount} status="info" />
        <StatTile icon={AlertTriangle} label="Lỗi" value={errorCount} status="danger" />
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-danger-soft border border-danger-soft rounded-xl p-4 text-danger text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Lỗi tải dữ liệu: {error}</span>
          <button onClick={loadData} className="ml-auto text-danger underline text-[10px] bg-transparent border-none cursor-pointer">Thử lại</button>
        </div>
      )}

      {/* Node Table */}
      <Panel
        title="Danh Sách Sensor Node"
        right={<Mono className="text-[10px] text-muted">{filteredNodes.length} node</Mono>}
        bodyClassName="p-0"
        className="overflow-hidden"
      >
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-card2/80 backdrop-blur border-b border-border text-muted text-[10px] uppercase tracking-wider">
              <th className="text-left px-4 py-2.5 font-semibold w-8"></th>
              <th className="text-left px-4 py-2.5 font-semibold">Node ID</th>
              <th className="text-left px-4 py-2.5 font-semibold">Tên Sensor Node</th>
              <th className="text-left px-4 py-2.5 font-semibold">Trạm / Đập</th>
              <th className="text-left px-4 py-2.5 font-semibold">ESP32 MAC</th>
              <th className="text-left px-4 py-2.5 font-semibold">Firmware</th>
              <th className="text-center px-4 py-2.5 font-semibold">Trạng thái</th>
              <th className="text-left px-4 py-2.5 font-semibold">Lần cuối</th>
              <th className="text-center px-4 py-2.5 font-semibold">Cảm biến</th>
              <th className="text-right px-4 py-2.5 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={10} className="text-center py-12 text-muted">Đang tải...</td></tr>
            )}

            {!loading && filteredNodes.length === 0 && (
              <tr><td colSpan={10} className="text-center py-12 text-muted">Không tìm thấy Sensor Node nào.</td></tr>
            )}

            {!loading && filteredNodes.map(node => {
              const st = STATUS_CONFIG[node.status] || STATUS_CONFIG.offline
              const isExpanded = expandedRows.has(node.id)
              const sensors = node.sensors || []
              const stationId = node.gateway?.stationId

              return (
                <>
                  {/* Node Row */}
                  <tr
                    key={node.id}
                    className="border-b border-border/50 hover:bg-card2/50 transition-colors cursor-pointer"
                    onClick={() => toggleExpanded(node.id)}
                  >
                    <td className="px-4 py-3">
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-accent" />
                        : <ChevronRight className="w-3.5 h-3.5 text-muted" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        {node.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-tx">{node.name}</div>
                      {node.installLocation && (
                        <div className="text-[9px] text-muted mt-0.5">{node.installLocation}</div>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Link
                        href={`/stations/${stationId}`}
                        className="text-tx hover:text-accent font-semibold text-[11px] inline-flex items-center gap-1 group/st"
                        title="Xem chi tiết Trạm quan trắc"
                      >
                        <span>{getStationName(stationId)}</span>
                        <ExternalLink className="w-3 h-3 text-muted group-hover/st:text-accent transition-colors" />
                      </Link>
                      <div className="text-[9px] text-muted">{getDamName(stationId)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-muted">{node.macAddress || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-muted">{node.firmwareVersion || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${node.status === 'online' ? 'animate-pulse-dot' : ''}`}></span>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted">
                      {timeAgo(node.lastSeenAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-info">{sensors.length}</span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/stations/${stationId}`}
                          className="p-1.5 bg-card2 border border-border rounded-lg text-info hover:border-info hover:bg-info/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Xem chi tiết Trạm quan trắc"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {!isViewer && (
                          <>
                            <button
                              onClick={(e) => openEditNodeModal(node, e)}
                              className="p-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent hover:bg-accent/20 hover:border-accent/40 transition-colors cursor-pointer"
                              title="Sửa node"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: node.id, name: node.name }) }}
                              className="p-1.5 bg-danger/10 border border-danger/20 rounded-lg text-danger hover:bg-danger/20 hover:border-danger/40 transition-colors cursor-pointer"
                              title="Xóa node"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded: Sensors List */}
                  {isExpanded && (
                    <tr key={`${node.id}-sensors`} className="bg-card2/50">
                      <td colSpan={10} className="px-6 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                            Danh sách cảm biến ({sensors.length})
                          </span>
                          {!isViewer && (
                            <button
                              onClick={(e) => openAddSensorModal(node.id, e)}
                              className="flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/30 rounded text-accent text-[9px] font-bold cursor-pointer hover:bg-accent/20 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Thêm cảm biến
                            </button>
                          )}
                        </div>

                        {sensors.length === 0 ? (
                          <div className="text-center py-4 text-muted text-[10px]">Chưa có cảm biến nào.</div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {sensors.map(sensor => {
                              const cfg = getSensorTypeConfig(sensor.sensorType)
                              const Icon = cfg.icon
                              const sCfg = SENSOR_STATUS_CONFIG[sensor.status] || SENSOR_STATUS_CONFIG.active

                              return (
                                <div
                                  key={sensor.id}
                                  className="bg-card border border-border rounded-lg p-3 flex items-start gap-3 group hover:border-accent/40 transition-colors"
                                >
                                  <div className={`w-8 h-8 rounded-lg ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[8px] font-bold ${sCfg.text}`}>
                                        <span className={`w-1 h-1 rounded-full ${sCfg.dot}`}></span>
                                        {sCfg.label}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-muted space-y-0.5">
                                      <div>Model: <span className="text-tx font-mono">{sensor.model || '—'}</span></div>
                                      <div>Đơn vị: <span className="text-tx font-mono">{sensor.unit || '—'}</span></div>
                                      {sensor.calibrationOffset != null && sensor.calibrationOffset !== 0 && (
                                        <div>Hiệu chỉnh: <span className="text-tx font-mono">{sensor.calibrationOffset}</span></div>
                                      )}
                                    </div>
                                  </div>
                                  {!isViewer && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => openEditSensorModal(node.id, sensor, e)}
                                        className="p-1 bg-accent/10 border border-accent/20 rounded text-accent hover:bg-accent/20 hover:border-accent/40 transition-colors cursor-pointer"
                                        title="Sửa"
                                      >
                                        <Pencil className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteSensor(node.id, sensor.id) }}
                                        className="p-1 bg-danger/10 border border-danger/20 rounded text-danger hover:bg-danger/20 hover:border-danger/40 transition-colors cursor-pointer"
                                        title="Xóa"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
          </tbody>
        </table>
      </Panel>

      {/* ── TOAST NOTIFICATION ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── MODAL: CREATE / EDIT NODE ── */}
      <Modal
        open={nodeModalOpen}
        onClose={() => setNodeModalOpen(false)}
        title={editingNode ? 'Sửa Sensor Node' : 'Thêm Sensor Node mới'}
        icon={Cpu}
        maxWidth="max-w-3xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setNodeModalOpen(false)}>Hủy</Button>
            <Button type="submit" form="node-form" variant="primary" loading={savingNode}>
              {editingNode ? 'Lưu thay đổi' : 'Tạo node mới'}
            </Button>
          </FormActions>
        }
      >
        <form id="node-form" onSubmit={handleSaveNode} className="space-y-2.5">

          <Field label="Tên Sensor Node" required htmlFor="node-name">
            <TextInput
              id="node-name"
              required
              value={nodeForm.name}
              onChange={e => setNodeForm(p => ({ ...p, name: e.target.value }))}
              placeholder="vd: Sensor Node K25+500"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Mô tả" htmlFor="node-description">
              <TextInput
                id="node-description"
                value={nodeForm.description}
                onChange={e => setNodeForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Mô tả vị trí, mục đích..."
              />
            </Field>
            <Field label="Vị trí lắp đặt" htmlFor="node-location">
              <TextInput
                id="node-location"
                value={nodeForm.installLocation}
                onChange={e => setNodeForm(p => ({ ...p, installLocation: e.target.value }))}
                placeholder="vd: Thân đập chính - K25+500"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Field label="MAC Address ESP32" htmlFor="node-mac">
              <TextInput
                id="node-mac"
                value={nodeForm.macAddress}
                onChange={e => setNodeForm(p => ({ ...p, macAddress: e.target.value }))}
                placeholder="AA:BB:CC:DD:EE:FF"
                className="font-mono"
              />
            </Field>
            <Field label="Phiên bản Firmware" htmlFor="node-firmware">
              <TextInput
                id="node-firmware"
                value={nodeForm.firmwareVersion}
                onChange={e => setNodeForm(p => ({ ...p, firmwareVersion: e.target.value }))}
                placeholder="vd: v1.0.0"
                className="font-mono"
              />
            </Field>
            <Field label="Gắn vào Trạm" required htmlFor="node-station">
              <Select
                id="node-station"
                required
                value={nodeForm.stationId}
                onChange={e => setNodeForm(p => ({ ...p, stationId: e.target.value }))}
              >
                <option value="">— Chọn trạm —</option>
                {stations.map(s => {
                  const dam = dams.find(d => d.id === s.damId)
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({dam ? dam.name : s.damId})
                    </option>
                  )
                })}
              </Select>
            </Field>
          </div>

          {/* ⚡ Cấu Hình Ngưỡng Cảnh Báo Độ Rung AI Jetson TX2 */}
          <div className="bg-card2 border border-amber-500/30 rounded-lg p-2.5 space-y-2 mt-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase tracking-wide">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span>Ngưỡng độ rung AI Jetson TX2 (mm/s)</span>
              </div>
              <span className="text-[9px] text-safe font-semibold bg-safe/10 border border-safe/30 px-1.5 py-0.5 rounded shrink-0">
                Tự động đồng bộ MQTT
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              <Field label="Chú ý" required htmlFor="node-warn-high">
                <TextInput
                  id="node-warn-high"
                  type="number" step="0.1" required
                  value={nodeForm.warnHigh}
                  onChange={e => setNodeForm(p => ({ ...p, warnHigh: e.target.value }))}
                  placeholder="2.5"
                  className="font-mono"
                />
              </Field>
              <Field label="Cảnh báo" required htmlFor="node-alert-high">
                <TextInput
                  id="node-alert-high"
                  type="number" step="0.1" required
                  value={nodeForm.vibrationThreshold}
                  onChange={e => setNodeForm(p => ({ ...p, vibrationThreshold: e.target.value }))}
                  placeholder="15.0"
                  className="font-mono"
                />
              </Field>
              <Field label="Nguy cấp" required htmlFor="node-critical-high">
                <TextInput
                  id="node-critical-high"
                  type="number" step="0.1" required
                  value={nodeForm.criticalHigh}
                  onChange={e => setNodeForm(p => ({ ...p, criticalHigh: e.target.value }))}
                  placeholder="25.0"
                  className="font-mono"
                />
              </Field>
              <Field label="Số lần liên tiếp" required htmlFor="node-alert-count">
                <TextInput
                  id="node-alert-count"
                  type="number" required
                  value={nodeForm.alertMinCount}
                  onChange={e => setNodeForm(p => ({ ...p, alertMinCount: e.target.value }))}
                  placeholder="4"
                  className="font-mono"
                />
              </Field>
              <Field label="Thời gian (s)" required htmlFor="node-alert-duration">
                <TextInput
                  id="node-alert-duration"
                  type="number" step="0.5" required
                  value={nodeForm.alertMinDurationSec}
                  onChange={e => setNodeForm(p => ({ ...p, alertMinDurationSec: e.target.value }))}
                  placeholder="6.0"
                  className="font-mono"
                />
              </Field>
            </div>

          </div>

          {!editingNode && (
            <div className="bg-card2 border border-border rounded-lg px-3 py-2 text-[10px] text-muted">
              <span className="text-info font-semibold">Cảm biến mặc định: </span>
              <span className="text-sky-400">Mực nước (HC-SR04)</span>, {' '}
              <span className="text-emerald-400">Độ ẩm (DHT22)</span>, {' '}
              <span className="text-orange-400">Độ rung (SW-420)</span>
            </div>
          )}
        </form>
      </Modal>

      {/* ── MODAL: CREATE / EDIT SENSOR ── */}
      <Modal
        open={sensorModalOpen}
        onClose={() => setSensorModalOpen(false)}
        title={editingSensor ? 'Sửa cảm biến' : 'Thêm cảm biến'}
        icon={Activity}
        maxWidth="max-w-md"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setSensorModalOpen(false)}>Hủy</Button>
            <Button type="submit" form="sensor-form" variant="primary" loading={savingSensor}>
              {editingSensor ? 'Lưu thay đổi' : 'Thêm cảm biến'}
            </Button>
          </FormActions>
        }
      >
        <form id="sensor-form" onSubmit={handleSaveSensor} className="space-y-3">
          <Field label="Loại cảm biến" htmlFor="sensor-type">
            <Select
              id="sensor-type"
              value={sensorForm.sensorType}
              onChange={e => {
                const type = e.target.value
                const cfg = SENSOR_TYPE_CONFIG[type]
                setSensorForm(p => ({
                  ...p,
                  sensorType: type,
                  model: cfg?.defaultModel || '',
                  unit: cfg?.unit || '',
                }))
              }}
            >
              <option value="water_level">Mực nước</option>
              <option value="humidity">Độ ẩm</option>
              <option value="vibration">Độ rung</option>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Model" htmlFor="sensor-model">
              <TextInput
                id="sensor-model"
                value={sensorForm.model}
                onChange={e => setSensorForm(p => ({ ...p, model: e.target.value }))}
                placeholder="vd: HC-SR04"
                className="font-mono"
              />
            </Field>
            <Field label="Đơn vị" htmlFor="sensor-unit">
              <TextInput
                id="sensor-unit"
                value={sensorForm.unit}
                onChange={e => setSensorForm(p => ({ ...p, unit: e.target.value }))}
                placeholder="vd: cm, %, mm/s"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Giá trị hiệu chỉnh" htmlFor="sensor-calibration">
              <TextInput
                id="sensor-calibration"
                type="number"
                step="0.01"
                value={sensorForm.calibrationOffset}
                onChange={e => setSensorForm(p => ({ ...p, calibrationOffset: Number(e.target.value) }))}
                className="font-mono"
              />
            </Field>
            {editingSensor && (
              <Field label="Trạng thái" htmlFor="sensor-status">
                <Select
                  id="sensor-status"
                  value={sensorForm.status}
                  onChange={e => setSensorForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Ngừng</option>
                  <option value="faulty">Lỗi</option>
                </Select>
              </Field>
            )}
          </div>
        </form>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa Sensor Node"
        icon={AlertTriangle}
        maxWidth="max-w-md"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Hủy</Button>
            <Button variant="danger" loading={deletingNode} onClick={handleDeleteNode}>Xóa Sensor Node</Button>
          </FormActions>
        }
      >
        <p className="text-[10px] text-muted m-0 -mt-2">Hành động này không thể hoàn tác</p>
        <p className="text-[11px] text-tx leading-relaxed bg-card2/70 p-3 rounded-lg border border-border">
          Xóa Sensor Node <strong className="text-danger">{deleteConfirm?.name}</strong> (ID: {deleteConfirm?.id})?
          <span className="flex items-center gap-1 text-[10px] text-warning mt-1">
            <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
            <span>Tất cả cảm biến trong Sensor Node này sẽ bị xóa theo.</span>
          </span>
        </p>
      </Modal>
    </div>
  )
}
