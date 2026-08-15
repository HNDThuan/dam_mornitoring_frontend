'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchSensorClusters,
  fetchDams,
  fetchStations,
  createSensorCluster,
  updateSensorCluster,
  deleteSensorCluster,
  addSensorDevice,
  updateSensorDevice,
  deleteSensorDevice,
  fetchThresholdConfigs,
  updateThresholdConfig,
} from '@/lib/api'
import { Label } from '@/components/ui'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  X,
  AlertTriangle,
  Cpu,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronRight,
  Droplets,
  Thermometer,
  Activity,
  CircleDot,
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

const DEVICE_STATUS_CONFIG = {
  active: { label: 'Hoạt động', dot: 'bg-safe', text: 'text-safe' },
  inactive: { label: 'Ngừng', dot: 'bg-muted', text: 'text-muted' },
  faulty: { label: 'Lỗi', dot: 'bg-danger', text: 'text-danger' },
}

export default function SensorClustersPage() {
  const { user, isAdmin, isOperator, isViewer, assignedDamId } = useAuth()
  const [clusters, setClusters] = useState([])
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
  const [clusterModalOpen, setClusterModalOpen] = useState(false)
  const [editingCluster, setEditingCluster] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState(null)
  const [deviceClusterId, setDeviceClusterId] = useState(null)

  // Toast State
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' }

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Cluster form
  const [clusterForm, setClusterForm] = useState({
    id: '', name: '', description: '', espMacAddress: '', firmwareVersion: '', installLocation: '', stationId: '',
  })

  // Device form
  const [deviceForm, setDeviceForm] = useState({
    sensorType: 'water_level', model: '', unit: '', calibrationOffset: 0, status: 'active',
  })

  // Fetch data
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const activeDam = isOperator && assignedDamId ? assignedDamId : (filterDamId || undefined)
      const [clustersRes, damsRes, stationsRes] = await Promise.all([
        fetchSensorClusters(filterStationId || undefined, activeDam),
        fetchDams(),
        fetchStations(activeDam),
      ])

      let allClusters = clustersRes.clusters || []
      let allDams = damsRes.dams || []
      let allStations = stationsRes.stations || []

      // Scope strictly to assigned dam for operators
      if (isOperator && assignedDamId) {
        allDams = allDams.filter(d => d.id === assignedDamId)
        allStations = allStations.filter(s => s.damId === assignedDamId)
        allClusters = allClusters.filter(c => {
          const st = allStations.find(s => s.id === c.stationId || s.id === c.gateway?.stationId)
          return c.damId === assignedDamId || (st && st.damId === assignedDamId)
        })
      }

      setClusters(allClusters)
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

  // Filter clusters by search
  const filteredClusters = clusters.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.espMacAddress && c.espMacAddress.toLowerCase().includes(q)) ||
      (c.installLocation && c.installLocation.toLowerCase().includes(q))
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

  // ── Cluster CRUD ──
  const openCreateClusterModal = () => {
    setEditingCluster(null)
    setClusterForm({
      id: '',
      name: '',
      description: '',
      espMacAddress: '',
      firmwareVersion: 'v1.0.0',
      installLocation: '',
      stationId: filteredStations[0]?.id || stations[0]?.id || '',
      vibrationThreshold: 15.0,
      warnHigh: 2.5,
      criticalHigh: 25.0,
      alertMinCount: 4,
      alertMinDurationSec: 6.0,
    })
    setClusterModalOpen(true)
  }

  const openEditClusterModal = async (cluster, e) => {
    e?.stopPropagation()
    setEditingCluster(cluster)
    const effectiveStationId = cluster.stationId || cluster.gateway?.stationId || ''
    
    let warnHigh = cluster.warnHigh ?? 2.5
    let vibrationThreshold = cluster.vibrationThreshold ?? 15.0
    let criticalHigh = cluster.criticalHigh ?? 25.0

    if (effectiveStationId) {
      const st = stations.find(s => String(s.id) === String(effectiveStationId))
      if (st && st.damId) {
        try {
          const res = await fetchThresholdConfigs(st.damId)
          const configs = res?.configs || []
          const vibCfg = configs.find(c => c.sensorType === 'vibration')
          if (vibCfg) {
            warnHigh = vibCfg.warnHigh ?? warnHigh
            vibrationThreshold = vibCfg.alertHigh ?? vibrationThreshold
            criticalHigh = vibCfg.criticalHigh ?? criticalHigh
          }
        } catch (err) {
          console.warn('[SensorClusters] Lỗi nạp ngưỡng đồng bộ:', err)
        }
      }
    }

    setClusterForm({
      id: cluster.id,
      name: cluster.name || '',
      description: cluster.description || '',
      espMacAddress: cluster.macAddress || cluster.espMacAddress || '',
      firmwareVersion: cluster.firmwareVersion || '',
      installLocation: cluster.installLocation || '',
      stationId: effectiveStationId,
      vibrationThreshold,
      warnHigh,
      criticalHigh,
      alertMinCount: cluster.alertMinCount ?? 4,
      alertMinDurationSec: cluster.alertMinDurationSec ?? 6.0,
    })
    setClusterModalOpen(true)
  }

  const handleSaveCluster = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        name: clusterForm.name,
        description: clusterForm.description,
        macAddress: clusterForm.espMacAddress,
        espMacAddress: clusterForm.espMacAddress,
        firmwareVersion: clusterForm.firmwareVersion,
        installLocation: clusterForm.installLocation,
        stationId: clusterForm.stationId ? Number(clusterForm.stationId) : undefined,
        vibrationThreshold: Number(clusterForm.vibrationThreshold),
        warnHigh: Number(clusterForm.warnHigh),
        criticalHigh: Number(clusterForm.criticalHigh),
        alertMinCount: Number(clusterForm.alertMinCount),
        alertMinDurationSec: Number(clusterForm.alertMinDurationSec),
      }
      if (editingCluster) {
        await updateSensorCluster(editingCluster.id, payload)
        showToast('Cập nhật node & phát tin nhắn MQTT đồng bộ Jetson TX2 thành công!', 'success')
      } else {
        const res = await createSensorCluster(payload)
        const newId = res?.node?.id || res?.cluster?.id || ''
        showToast(`Tạo node thành công! (Mã: ${newId})`, 'success')
      }

      // Đồng bộ 2 chiều sang ThresholdConfig của Đập & Trạm
      if (clusterForm.stationId) {
        const st = stations.find(s => String(s.id) === String(clusterForm.stationId))
        if (st && st.damId) {
          try {
            const res = await fetchThresholdConfigs(st.damId)
            const configs = res?.configs || []
            const vibCfg = configs.find(c => c.sensorType === 'vibration')
            if (vibCfg) {
              await updateThresholdConfig(vibCfg.id, {
                warnHigh: Number(clusterForm.warnHigh),
                alertHigh: Number(clusterForm.vibrationThreshold),
                criticalHigh: Number(clusterForm.criticalHigh),
              })
              console.log(`[SensorClusters] Đã đồng bộ ngược ngưỡng độ rung sang ThresholdConfig đập ${st.damId}`)
            }
          } catch (err) {
            console.warn('[SensorClusters] Không thể đồng bộ ngược sang Đập:', err)
          }
        }
      }

      setClusterModalOpen(false)
      loadData(true)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteCluster = async () => {
    if (!deleteConfirm) return
    try {
      await deleteSensorCluster(deleteConfirm.id)
      showToast(`Đã xóa Sensor Node ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      loadData(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    }
  }

  // ── Device CRUD ──
  const openAddDeviceModal = (clusterId, e) => {
    e?.stopPropagation()
    setEditingDevice(null)
    setDeviceClusterId(clusterId)
    setDeviceForm({ sensorType: 'water_level', model: 'HC-SR04', unit: 'cm', calibrationOffset: 0, status: 'active' })
    setDeviceModalOpen(true)
  }

  const openEditDeviceModal = (clusterId, device, e) => {
    e?.stopPropagation()
    setEditingDevice(device)
    setDeviceClusterId(clusterId)
    setDeviceForm({
      sensorType: device.sensorType || 'water_level',
      model: device.model || '',
      unit: device.unit || '',
      calibrationOffset: device.calibrationOffset || 0,
      status: device.status || 'active',
    })
    setDeviceModalOpen(true)
  }

  const handleSaveDevice = async (e) => {
    e.preventDefault()
    try {
      if (editingDevice) {
        await updateSensorDevice(deviceClusterId, editingDevice.id, deviceForm)
        showToast('Cập nhật cảm biến thành công!', 'success')
      } else {
        await addSensorDevice(deviceClusterId, deviceForm)
        showToast('Thêm cảm biến vào Sensor Node thành công!', 'success')
      }
      setDeviceModalOpen(false)
      loadData(true)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDeleteDevice = async (clusterId, deviceId) => {
    if (!confirm('Xóa cảm biến này?')) return
    try {
      await deleteSensorDevice(clusterId, deviceId)
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
  const onlineCount = clusters.filter(c => c.status === 'online').length
  const offlineCount = clusters.filter(c => c.status === 'offline').length
  const errorCount = clusters.filter(c => c.status === 'error').length

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
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
              className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] outline-none focus:border-accent shrink-0 cursor-pointer"
            >
              <option value="">Tất cả đập</option>
              {dams.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          {/* Filter by Station */}
          <select
            value={filterStationId}
            onChange={e => setFilterStationId(e.target.value)}
            className="h-9 bg-card2 border border-border rounded-lg px-3 text-tx text-[11px] outline-none focus:border-accent shrink-0 cursor-pointer"
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
              onClick={openCreateClusterModal}
              className="h-9 flex items-center gap-1.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-lg text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-indigo-500/20 shrink-0 whitespace-nowrap transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Sensor Node</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <Server className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div>
            <div className="text-[9px] text-muted uppercase tracking-wider">Tổng Node</div>
            <div className="text-lg font-bold text-tx font-mono">{clusters.length}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-safe/15 flex items-center justify-center">
            <Wifi className="w-4.5 h-4.5 text-safe" />
          </div>
          <div>
            <div className="text-[9px] text-muted uppercase tracking-wider">Online</div>
            <div className="text-lg font-bold text-safe font-mono">{onlineCount}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
            <WifiOff className="w-4.5 h-4.5 text-muted" />
          </div>
          <div>
            <div className="text-[9px] text-muted uppercase tracking-wider">Offline</div>
            <div className="text-lg font-bold text-muted font-mono">{offlineCount}</div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-danger/15 flex items-center justify-center">
            <AlertTriangle className="w-4.5 h-4.5 text-danger" />
          </div>
          <div>
            <div className="text-[9px] text-muted uppercase tracking-wider">Lỗi</div>
            <div className="text-lg font-bold text-danger font-mono">{errorCount}</div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-danger-soft border border-danger-soft rounded-xl p-4 text-danger text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Lỗi tải dữ liệu: {error}</span>
          <button onClick={loadData} className="ml-auto text-danger underline text-[10px] bg-transparent border-none cursor-pointer">Thử lại</button>
        </div>
      )}

      {/* Cluster Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-card2 border-b border-border text-muted text-[10px] uppercase tracking-wider">
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

            {!loading && filteredClusters.length === 0 && (
              <tr><td colSpan={10} className="text-center py-12 text-muted">Không tìm thấy Sensor Node nào.</td></tr>
            )}

            {!loading && filteredClusters.map(cluster => {
              const st = STATUS_CONFIG[cluster.status] || STATUS_CONFIG.offline
              const isExpanded = expandedRows.has(cluster.id)
              const devices = cluster.devices || []

              return (
                <>
                  {/* Cluster Row */}
                  <tr
                    key={cluster.id}
                    className="border-b border-border/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => toggleExpanded(cluster.id)}
                  >
                    <td className="px-4 py-3">
                      {isExpanded
                        ? <ChevronDown className="w-3.5 h-3.5 text-accent" />
                        : <ChevronRight className="w-3.5 h-3.5 text-muted" />}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        {cluster.id}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-tx">{cluster.name}</div>
                      {cluster.installLocation && (
                        <div className="text-[9px] text-muted mt-0.5">{cluster.installLocation}</div>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Link
                        href={`/stations/${cluster.stationId || cluster.gateway?.stationId}`}
                        className="text-tx hover:text-accent font-semibold text-[11px] inline-flex items-center gap-1 group/st"
                        title="Xem chi tiết Trạm quan trắc"
                      >
                        <span>{getStationName(cluster.stationId || cluster.gateway?.stationId)}</span>
                        <ExternalLink className="w-3 h-3 text-muted group-hover/st:text-accent transition-colors" />
                      </Link>
                      <div className="text-[9px] text-muted">{getDamName(cluster.stationId || cluster.gateway?.stationId)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-muted">{cluster.espMacAddress || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] text-muted">{cluster.firmwareVersion || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold ${st.bg} ${st.text} border ${st.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot} ${cluster.status === 'online' ? 'animate-pulse-dot' : ''}`}></span>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted">
                      {timeAgo(cluster.lastSeenAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-info">{devices.length}</span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/stations/${cluster.stationId}`}
                          className="p-1.5 bg-card2 border border-border rounded-lg text-info hover:border-info hover:bg-info/10 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title="Xem chi tiết Trạm quan trắc"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        {!isViewer && (
                          <>
                            <button
                              onClick={(e) => openEditClusterModal(cluster, e)}
                              className="p-1.5 bg-card2 border border-border rounded-lg text-accent hover:border-accent transition-colors cursor-pointer"
                              title="Sửa cụm"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ id: cluster.id, name: cluster.name }) }}
                              className="p-1.5 bg-card2 border border-border rounded-lg text-danger hover:border-danger transition-colors cursor-pointer"
                              title="Xóa cụm"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded: Devices List */}
                  {isExpanded && (
                    <tr key={`${cluster.id}-devices`} className="bg-card2/50">
                      <td colSpan={10} className="px-6 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                            Danh sách cảm biến ({devices.length})
                          </span>
                          {!isViewer && (
                            <button
                              onClick={(e) => openAddDeviceModal(cluster.id, e)}
                              className="flex items-center gap-1 px-2 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-400 text-[9px] font-bold cursor-pointer hover:bg-indigo-500/20 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Thêm cảm biến
                            </button>
                          )}
                        </div>

                        {devices.length === 0 ? (
                          <div className="text-center py-4 text-muted text-[10px]">Chưa có cảm biến nào.</div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {devices.map(device => {
                              const cfg = getSensorTypeConfig(device.sensorType)
                              const Icon = cfg.icon
                              const dCfg = DEVICE_STATUS_CONFIG[device.status] || DEVICE_STATUS_CONFIG.active

                              return (
                                <div
                                  key={device.id}
                                  className="bg-card border border-border rounded-lg p-3 flex items-start gap-3 group hover:border-accent/40 transition-colors"
                                >
                                  <div className={`w-8 h-8 rounded-lg ${cfg.bgColor} flex items-center justify-center shrink-0`}>
                                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
                                      <span className={`inline-flex items-center gap-1 px-1.5 py-0 rounded text-[8px] font-bold ${dCfg.text}`}>
                                        <span className={`w-1 h-1 rounded-full ${dCfg.dot}`}></span>
                                        {dCfg.label}
                                      </span>
                                    </div>
                                    <div className="text-[9px] text-muted space-y-0.5">
                                      <div>Model: <span className="text-tx font-mono">{device.model || '—'}</span></div>
                                      <div>Đơn vị: <span className="text-tx font-mono">{device.unit || '—'}</span></div>
                                      {device.calibrationOffset != null && device.calibrationOffset !== 0 && (
                                        <div>Hiệu chỉnh: <span className="text-tx font-mono">{device.calibrationOffset}</span></div>
                                      )}
                                    </div>
                                  </div>
                                  {!isViewer && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={(e) => openEditDeviceModal(cluster.id, device, e)}
                                        className="p-1 bg-card2 border border-border rounded text-accent hover:border-accent transition-colors cursor-pointer"
                                        title="Sửa"
                                      >
                                        <Pencil className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteDevice(cluster.id, device.id) }}
                                        className="p-1 bg-card2 border border-border rounded text-danger hover:border-danger transition-colors cursor-pointer"
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
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`fixed top-14 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${toast.type === 'error'
          ? 'bg-danger/20 border-danger/40 text-danger shadow-danger/10'
          : 'bg-safe/20 border-safe/40 text-safe shadow-safe/10'
          }`}>
          <span className="text-[12px]">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-muted hover:text-tx bg-transparent border-none cursor-pointer p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT CLUSTER ── */}
      {clusterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>{editingCluster ? 'Sửa Sensor Node' : 'Thêm Sensor Node mới'}</span>
              </h3>
              <button
                onClick={() => setClusterModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCluster} className="p-5 space-y-3 text-[11px]">

              <div>
                <Label className="mb-1">Tên Sensor Node</Label>
                <input
                  required
                  value={clusterForm.name}
                  onChange={e => setClusterForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="vd: Sensor Node K25+500"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div>
                <Label className="mb-1">Mô tả</Label>
                <input
                  value={clusterForm.description}
                  onChange={e => setClusterForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Mô tả vị trí, mục đích..."
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">MAC Address ESP32</Label>
                  <input
                    value={clusterForm.espMacAddress}
                    onChange={e => setClusterForm(p => ({ ...p, espMacAddress: e.target.value }))}
                    placeholder="AA:BB:CC:DD:EE:FF"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Phiên bản Firmware</Label>
                  <input
                    value={clusterForm.firmwareVersion}
                    onChange={e => setClusterForm(p => ({ ...p, firmwareVersion: e.target.value }))}
                    placeholder="vd: v1.0.0"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">Vị trí lắp đặt</Label>
                <input
                  value={clusterForm.installLocation}
                  onChange={e => setClusterForm(p => ({ ...p, installLocation: e.target.value }))}
                  placeholder="vd: Thân đập chính - K25+500"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div>
                <Label className="mb-1">Gắn vào Trạm</Label>
                <select
                  required
                  value={clusterForm.stationId}
                  onChange={e => setClusterForm(p => ({ ...p, stationId: e.target.value }))}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
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
                </select>
              </div>

              {/* ⚡ Cấu Hình Ngưỡng Cảnh Báo AI Jetson TX2 */}
              <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2 my-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Cấu Hình Ngưỡng AI Jetson TX2 (MQTT Realtime Sync)</span>
                  </div>
                  <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                    🟢 Tự động đồng bộ MQTT
                  </span>
                </div>
                <div className="text-[9px] text-muted">
                  Khi lưu, hệ thống sẽ tự động phát tin nhắn MQTT <code className="text-amber-400">config/gateway/+/update</code> tới Jetson TX2.
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <Label className="mb-1 text-warning">Chú ý (warn_high)</Label>
                    <input
                      type="number" step="0.1" required
                      value={clusterForm.warnHigh}
                      onChange={e => setClusterForm(p => ({ ...p, warnHigh: e.target.value }))}
                      placeholder="2.5"
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-danger">Cảnh báo (alert_high)</Label>
                    <input
                      type="number" step="0.1" required
                      value={clusterForm.vibrationThreshold}
                      onChange={e => setClusterForm(p => ({ ...p, vibrationThreshold: e.target.value }))}
                      placeholder="15.0"
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="mb-1 text-red-500">Nguy cấp (critical_high)</Label>
                    <input
                      type="number" step="0.1" required
                      value={clusterForm.criticalHigh}
                      onChange={e => setClusterForm(p => ({ ...p, criticalHigh: e.target.value }))}
                      placeholder="25.0"
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <Label className="mb-1">Số lần vượt ngưỡng liên tiếp</Label>
                    <input
                      type="number" required
                      value={clusterForm.alertMinCount}
                      onChange={e => setClusterForm(p => ({ ...p, alertMinCount: e.target.value }))}
                      placeholder="4"
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="mb-1">Thời gian duy trì tối thiểu (s)</Label>
                    <input
                      type="number" step="0.5" required
                      value={clusterForm.alertMinDurationSec}
                      onChange={e => setClusterForm(p => ({ ...p, alertMinDurationSec: e.target.value }))}
                      placeholder="6.0"
                      className="w-full bg-card border border-border rounded px-2.5 py-1.5 text-tx outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {!editingCluster && (
                <div className="bg-card2 border border-border rounded p-3 text-[10px] text-muted">
                  <div className="flex items-center gap-1.5 mb-1 text-info font-semibold">
                    <CircleDot className="w-3 h-3" />
                    <span>Cảm biến mặc định</span>
                  </div>
                  <span>Hệ thống sẽ tự động tạo 3 cảm biến: </span>
                  <span className="text-sky-400">Mực nước (HC-SR04)</span>, {' '}
                  <span className="text-emerald-400">Độ ẩm (DHT22)</span>, {' '}
                  <span className="text-orange-400">Độ rung (SW-420)</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setClusterModalOpen(false)}
                  className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded text-white text-[11px] font-bold cursor-pointer border-none"
                >
                  {editingCluster ? 'Lưu thay đổi' : 'Tạo cụm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT DEVICE ── */}
      {deviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-400" />
                <span>{editingDevice ? 'Sửa cảm biến' : 'Thêm cảm biến'}</span>
              </h3>
              <button
                onClick={() => setDeviceModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="p-5 space-y-3 text-[11px]">
              <div>
                <Label className="mb-1">Loại cảm biến</Label>
                <select
                  value={deviceForm.sensorType}
                  onChange={e => {
                    const type = e.target.value
                    const cfg = SENSOR_TYPE_CONFIG[type]
                    setDeviceForm(p => ({
                      ...p,
                      sensorType: type,
                      model: cfg?.defaultModel || '',
                      unit: cfg?.unit || '',
                    }))
                  }}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                >
                  <option value="water_level">Mực nước</option>
                  <option value="humidity">Độ ẩm</option>
                  <option value="vibration">Độ rung</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">Model</Label>
                  <input
                    value={deviceForm.model}
                    onChange={e => setDeviceForm(p => ({ ...p, model: e.target.value }))}
                    placeholder="vd: HC-SR04"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Đơn vị</Label>
                  <input
                    value={deviceForm.unit}
                    onChange={e => setDeviceForm(p => ({ ...p, unit: e.target.value }))}
                    placeholder="vd: cm, %, mm/s"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">Giá trị hiệu chỉnh</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={deviceForm.calibrationOffset}
                    onChange={e => setDeviceForm(p => ({ ...p, calibrationOffset: Number(e.target.value) }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                {editingDevice && (
                  <div>
                    <Label className="mb-1">Trạng thái</Label>
                    <select
                      value={deviceForm.status}
                      onChange={e => setDeviceForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Ngừng</option>
                      <option value="faulty">Lỗi</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setDeviceModalOpen(false)}
                  className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-rose-500 rounded text-white text-[11px] font-bold cursor-pointer border-none"
                >
                  {editingDevice ? 'Lưu thay đổi' : 'Thêm cảm biến'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-3 text-danger">
              <div className="w-10 h-10 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-tx m-0">Xác nhận xóa Sensor Node</h3>
                <p className="text-[10px] text-muted m-0">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-[11px] text-tx leading-relaxed mb-4 bg-card2 p-3 rounded border border-border">
              Xóa Sensor Node <strong className="text-danger">{deleteConfirm.name}</strong> (ID: {deleteConfirm.id})?
              <span className="flex items-center gap-1 text-[10px] text-warning mt-1">
                <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
                <span>Tất cả cảm biến trong Sensor Node này sẽ bị xóa theo.</span>
              </span>
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteCluster}
                className="px-4 py-2 bg-danger rounded text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-danger/20"
              >
                Xóa Sensor Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
