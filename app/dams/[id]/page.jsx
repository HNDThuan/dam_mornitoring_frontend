'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { getSocket } from '@/lib/socket'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Panel, RadialGauge, LiveDot } from '@/components/ui'
import { Field, TextInput, Select, Modal, FormActions, Button, Toast } from '@/components/form'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  AlertTriangle,
  Database,
  Radio,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Droplet,
  Activity,
  Sliders,
  Zap,
  Map,
} from 'lucide-react'
import { fetchThresholdConfigs, updateThresholdConfig, fetchNodes, updateNode } from '@/lib/api'
import DamMap from '@/components/DamMap'

export default function DamDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const {
    dams,
    stations,
    loading,
    error,
    refetch,
    createDam,
    updateDam,
    deleteDam,
    createStation,
    updateStation,
    deleteStation,
  } = useDamData()
  const { t, locale } = useLanguage()
  const { isAdmin, isOperator, isViewer, assignedDamId } = useAuth()

  const [search, setSearch] = useState('')

  // Real-time Socket.IO live updating for station sensors
  const [liveStationMap, setLiveStationMap] = useState({})

  useEffect(() => {
    const socket = getSocket()
    const onUpdate = (snapshot) => {
      if (!snapshot) return
      const stId = snapshot.stationId
      if (stId) {
        setLiveStationMap(prev => ({
          ...prev,
          [stId]: {
            waterLevel: snapshot.waterLevel,
            humidity: snapshot.moisture,
            vibration: snapshot.amp,
            freq: snapshot.freq,
            clusterId: snapshot.clusterId,
            timestamp: snapshot.timestamp || new Date().toISOString(),
            status: 'online',
          }
        }))
      }
    }

    socket.on('update', onUpdate)
    socket.connect()

    return () => {
      socket.off('update', onUpdate)
    }
  }, [])

  // Modals state for Dam
  const [damModalOpen, setDamModalOpen] = useState(false)
  const [deleteDamConfirm, setDeleteDamConfirm] = useState(false)
  const [savingDam, setSavingDam] = useState(false)
  const [deletingDam, setDeletingDam] = useState(false)
  // Chỉ chứa thông tin tĩnh do người dùng nhập. Mực nước / mức chứa / trạng thái an toàn
  // đều do backend tự tính từ cảm biến nên không đưa vào form (sửa tay sẽ bị ghi đè ngay).
  const [damForm, setDamForm] = useState({
    name: '',
    location: '',
    latitude: 20.8167,
    longitude: 105.3265,
    cameraUrl: '',
  })

  // Modals state for Threshold Config
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false)
  const [savingThresholds, setSavingThresholds] = useState(false)
  const [thresholdConfigs, setThresholdConfigs] = useState([])
  const [thresholdForm, setThresholdForm] = useState({
    waterWarn: 10.0,
    waterAlert: 12.0,
    waterCritical: 15.0,
    tankHeight: 50.0,
    vibWarn: 2.5,
    vibAlert: 15.0,
    vibCritical: 25.0,
    mstWarn: 75.0,
    mstAlert: 85.0,
    mstCritical: 95.0,
  })

  const openThresholdModal = async () => {
    try {
      const res = await fetchThresholdConfigs(id)
      const configs = res?.configs || []
      setThresholdConfigs(configs)

      const waterCfg = configs.find(c => c.sensorType === 'water_level') || {}
      const vibCfg = configs.find(c => c.sensorType === 'vibration') || {}
      const mstCfg = configs.find(c => c.sensorType === 'humidity') || {}

      setThresholdForm({
        waterWarn: waterCfg.warnHigh ?? 10.0,
        waterAlert: waterCfg.alertHigh ?? 12.0,
        waterCritical: waterCfg.criticalHigh ?? 15.0,
        tankHeight: waterCfg.tankHeight ?? 50.0,

        vibWarn: vibCfg.warnHigh ?? 2.5,
        vibAlert: vibCfg.alertHigh ?? 15.0,
        vibCritical: vibCfg.criticalHigh ?? 25.0,

        mstWarn: mstCfg.warnHigh ?? 75.0,
        mstAlert: mstCfg.alertHigh ?? 85.0,
        mstCritical: mstCfg.criticalHigh ?? 95.0,
      })
      setThresholdModalOpen(true)
    } catch (err) {
      console.error('[DamDetail] Lỗi nạp ngưỡng:', err)
      setThresholdModalOpen(true)
    }
  }

  // Mức báo động sau phải cao hơn mức trước: Chú ý < Cảnh báo < Nguy cấp — cùng quy tắc backend
  // dùng để phân loại severity (classifySeverity so sánh '>=' theo thứ tự warn -> alert -> critical).
  const validateThresholdForm = () => {
    const groups = [
      ['Mực nước', thresholdForm.waterWarn, thresholdForm.waterAlert, thresholdForm.waterCritical],
      ['Độ rung', thresholdForm.vibWarn, thresholdForm.vibAlert, thresholdForm.vibCritical],
      ['Độ ẩm', thresholdForm.mstWarn, thresholdForm.mstAlert, thresholdForm.mstCritical],
    ]
    for (const [label, warn, alert, critical] of groups) {
      const w = Number(warn), a = Number(alert), c = Number(critical)
      if (!(w < a && a < c)) {
        return `Ngưỡng "${label}" không hợp lệ: yêu cầu Chú ý (${w}) < Cảnh báo (${a}) < Nguy cấp (${c}).`
      }
    }
    return null
  }

  const handleSaveThresholds = async (e) => {
    e.preventDefault()
    const validationError = validateThresholdForm()
    if (validationError) {
      showToast(validationError, 'error')
      return
    }
    // Không có bản ghi ngưỡng nào thì mọi lệnh update bên dưới sẽ bị bỏ qua và người dùng
    // vẫn thấy thông báo "thành công" dù chẳng lưu được gì — phải báo lỗi rõ ràng.
    if (!thresholdConfigs || thresholdConfigs.length === 0) {
      showToast('Đập này chưa có bản ghi cấu hình ngưỡng. Khởi động lại backend để hệ thống tự tạo ngưỡng mặc định, rồi thử lại.', 'error')
      return
    }

    try {
      setSavingThresholds(true)
      const waterCfg = thresholdConfigs.find(c => c.sensorType === 'water_level')
      const vibCfg = thresholdConfigs.find(c => c.sensorType === 'vibration')
      const mstCfg = thresholdConfigs.find(c => c.sensorType === 'humidity')

      const promises = []

      if (waterCfg) {
        promises.push(updateThresholdConfig(waterCfg.id, {
          warnHigh: Number(thresholdForm.waterWarn),
          alertHigh: Number(thresholdForm.waterAlert),
          criticalHigh: Number(thresholdForm.waterCritical),
          tankHeight: Number(thresholdForm.tankHeight),
        }))
      }

      if (vibCfg) {
        promises.push(updateThresholdConfig(vibCfg.id, {
          warnHigh: Number(thresholdForm.vibWarn),
          alertHigh: Number(thresholdForm.vibAlert),
          criticalHigh: Number(thresholdForm.vibCritical),
        }))
      }

      if (mstCfg) {
        promises.push(updateThresholdConfig(mstCfg.id, {
          warnHigh: Number(thresholdForm.mstWarn),
          alertHigh: Number(thresholdForm.mstAlert),
          criticalHigh: Number(thresholdForm.mstCritical),
        }))
      }

      await Promise.all(promises)
      showToast('Cập nhật cấu hình ngưỡng báo động & tự động đồng bộ xuống Jetson TX2 thành công!')
      setThresholdModalOpen(false)
      refetch()

      // Đồng bộ ngưỡng độ rung sang tất cả các Node thuộc Đập này để phát tin nhắn MQTT xuống Jetson TX2
      try {
        const nodeRes = await fetchNodes(undefined, undefined, id)
        const nodeList = nodeRes?.nodes || []
        if (Array.isArray(nodeList) && nodeList.length > 0) {
          const nodePromises = nodeList.map(node =>
            updateNode(node.id, {
              warnHigh: Number(thresholdForm.vibWarn),
              vibrationThreshold: Number(thresholdForm.vibAlert),
              criticalHigh: Number(thresholdForm.vibCritical),
            }).catch(e => console.warn('[DamDetail] Không thể đồng bộ node:', node.id, e))
          )
          await Promise.all(nodePromises)
          console.log(`[DamDetail] Đã đồng bộ ngưỡng độ rung sang ${nodeList.length} Node(s) Jetson TX2 thuộc Đập ${id}`)
        }
      } catch (err) {
        console.warn('[DamDetail] Lỗi đồng bộ Node Jetson TX2:', err)
      }
    } catch (err) {
      console.error('[DamDetail] Lỗi lưu ngưỡng:', err)
      showToast(err.message || 'Không thể cập nhật cấu hình ngưỡng!', 'error')
    } finally {
      setSavingThresholds(false)
    }
  }

  // Modals state for Stations
  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [savingStation, setSavingStation] = useState(false)
  const [deletingStation, setDeletingStation] = useState(false)

  const damId = String(id)
  // Fallback khi chưa tải xong / không tìm thấy: KHÔNG bịa số đo, để 0 + trạng thái 'unknown'
  // thay vì hiển thị số liệu giả trông như thật.
  const dam = dams.find(d => d.id === damId) || {
    id: damId,
    name: `Đập ${damId}`,
    location: '',
    waterLevel: 0,
    fillPct: 0,
    status: 'unknown',
    cameraUrl: '',
  }
  const damStatus = getStatus(dam.status)

  // Filter stations for this dam
  const damStations = stations.filter(st => {
    const isThisDam = st.damId === damId
    const matchesSearch = !search || st.name.toLowerCase().includes(search.toLowerCase()) || (st.location && st.location.toLowerCase().includes(search.toLowerCase()))
    return isThisDam && matchesSearch
  })

  // Dam Handlers
  const openEditDamModal = () => {
    setDamForm({
      name: dam.name || '',
      location: dam.location || '',
      latitude: dam.latitude ?? 20.8167,
      longitude: dam.longitude ?? 105.3265,
      cameraUrl: dam.cameraUrl || '',
    })
    setDamModalOpen(true)
  }

  const handleSaveDam = async (e) => {
    e.preventDefault()
    try {
      setSavingDam(true)
      await updateDam(dam.id, {
        name: damForm.name,
        location: damForm.location,
        latitude: Number(damForm.latitude),
        longitude: Number(damForm.longitude),
        cameraUrl: damForm.cameraUrl,
      })
      showToast('Cập nhật thông tin đập thành công!', 'success')
      setDamModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingDam(false)
    }
  }

  const handleConfirmDeleteDam = async () => {
    try {
      setDeletingDam(true)
      await deleteDam(dam.id)
      showToast(`Đã xóa đập thủy điện ${dam.name}!`, 'success')
      setDeleteDamConfirm(false)
      setTimeout(() => {
        router.push('/dams')
      }, 1000)
    } catch (err) {
      showToast(`Lỗi khi xóa đập: ${err.message}`, 'error')
    } finally {
      setDeletingDam(false)
    }
  }

  // Toast State
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Form state
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    latitude: 21.0381,
    longitude: 105.8492,
    river: '',
    km: '',
    damId: damId,
  })

  const openCreateStationModal = () => {
    setEditingStation(null)
    setStationForm({
      name: '',
      location: dam.location || '',
      latitude: dam.latitude || 21.0381,
      longitude: dam.longitude || 105.8492,
      river: 'Sông Hồng',
      km: 'K10+000',
      damId: damId,
    })
    setStationModalOpen(true)
  }

  const openEditStationModal = (st) => {
    setEditingStation(st)
    setStationForm({
      name: st.name || '',
      location: st.location || '',
      latitude: st.latitude ?? 21.0381,
      longitude: st.longitude ?? 105.8492,
      river: st.river || '',
      km: st.km || '',
      damId: st.damId || damId,
    })
    setStationModalOpen(true)
  }

  const handleSaveStation = async (e) => {
    e.preventDefault()
    try {
      setSavingStation(true)
      if (editingStation) {
        await updateStation(editingStation.id, {
          name: stationForm.name,
          location: stationForm.location,
          latitude: Number(stationForm.latitude),
          longitude: Number(stationForm.longitude),
          river: stationForm.river,
          km: stationForm.km,
          damId: damId,
        })
        showToast('Cập nhật trạm quan trắc thành công!', 'success')
      } else {
        await createStation({
          ...stationForm,
          latitude: Number(stationForm.latitude),
          longitude: Number(stationForm.longitude),
          damId: damId,
        })
        showToast(`Tạo trạm "${stationForm.name}" thành công!`, 'success')
      }
      setStationModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingStation(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      setDeletingStation(true)
      await deleteStation(deleteConfirm.id)
      showToast(`Đã xóa trạm ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      refetch(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeletingStation(false)
    }
  }

  // Operator Restriction: Cannot access other dams
  if (isOperator && assignedDamId && assignedDamId !== id) {
    return (
      <div className="p-8 min-h-[calc(100vh-48px)] flex items-center justify-center">
        <div className="bg-card border border-border max-w-md w-full rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto border border-danger/30">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-tx">Truy cập bị giới hạn</h2>
          <p className="text-xs text-muted leading-relaxed">
            Bạn là Cán bộ phụ trách đập <strong className="text-accent">{assignedDamId}</strong>. Bạn không có quyền truy cập hoặc xem dữ liệu của đập khác.
          </p>
          <Link
            href={`/dams/${assignedDamId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-bold text-xs rounded-xl no-underline hover:bg-accent/90"
          >
            <span>Về trang Đập của bạn ({assignedDamId})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 min-h-[calc(100vh-48px)] space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <Link href="/dams" className="text-muted no-underline hover:text-tx flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('damDetail.breadcrumbDams')}</span>
        </Link>
        <ChevronRight className="w-3 h-3 text-muted shrink-0" />
        <span className="text-tx font-bold">{dam.name}</span>
      </div>

      {/* Dam Summary Card */}
      <div className={`bg-card border border-border border-l-4 ${damStatus.leftBorder} rounded-xl p-5 shadow-panel`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-accent bg-accent/10 px-2.5 py-0.5 rounded border border-accent/20">
                {dam.id}
              </span>
              <h1 className="text-xl font-bold text-tx tracking-wide m-0">{dam.name}</h1>
              <Badge status={dam.status} />
            </div>
            {dam.location && (
              <div className="text-[11px] text-muted flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{dam.location}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Nút Cấu hình Ngưỡng Cảnh Báo */}
            {!isViewer && (
              <button
                onClick={openThresholdModal}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-500/40 rounded-lg text-amber-400 text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 transition-colors cursor-pointer"
                title="Cấu hình Ngưỡng Cảnh Báo cho Đập"
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Cấu hình Ngưỡng Cảnh Báo</span>
              </button>
            )}

            {/* Dam Action Buttons: Sửa, Xóa */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 border-r border-border/60 pr-3">
                <button
                  onClick={openEditDamModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-accent text-[11px] font-bold bg-card2 hover:bg-white/5 transition-colors cursor-pointer"
                  title="Sửa thông tin Đập"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" />
                  <span>Sửa đập</span>
                </button>
                <button
                  onClick={() => setDeleteDamConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-danger/30 rounded-lg text-danger text-[11px] font-bold bg-danger/10 hover:bg-danger/20 transition-colors cursor-pointer"
                  title="Xóa Đập Thủy Điện"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Xóa đập</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 bg-card2 border border-border rounded-xl p-3">
              <RadialGauge value={dam.fillPct} size={65} stroke={5} status={dam.status} sublabel={t('damsPage.fillCapacity')} />
              <Divider vertical />
              <div>
                <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.waterLevel')}</div>
                <Mono className={`text-base font-bold ${damStatus.text}`}>{dam.waterLevel} m</Mono>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Header Actions for Stations */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-panel">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-tx m-0 tracking-wide uppercase">
            {t('damDetail.title', { name: dam.name })} ({damStations.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded-lg px-3 py-1.5 w-56 focus-within:border-accent transition-colors">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('damDetail.searchStation')}
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-muted text-[11px] font-medium bg-card2 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('stationsPage.refresh')}</span>
          </button>

          {!isViewer && (
            <button
              onClick={openCreateStationModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 rounded-md text-white text-[11px] font-bold cursor-pointer border-none transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('damDetail.addStation')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE LEAFLET GIS MAP ── */}
      <Panel
        title={
          <span className="flex items-center gap-1.5">
            <Map className="w-3 h-3" /> Bản đồ giám sát
          </span>
        }
        right={<span className="flex items-center gap-1.5"><LiveDot active /><span className="text-[10px] font-mono text-safe font-bold">LIVE</span></span>}
        bodyClassName="p-0"
        className="[&_.leaflet-container]:rounded-b-xl"
      >
        <DamMap dams={[dam]} stations={damStations} selectedDamId={dam.id} height="320px" />
      </Panel>

      {/* Stations Grid */}
      {damStations.length > 0 ? (
        <div className="grid grid-cols-3 gap-3.5">
          {damStations.map(st => {
            const stS = getStatus(st.status)
            const live = liveStationMap[st.id] || {}
            const isLiveStreamActive = Boolean(live.timestamp)

            // Kiểm tra trung thực Sensor Node của trạm
            const clusters = st.sensorClusters || []
            const hasClusters = clusters.length > 0
            const onlineClusters = clusters.filter(c => c.status === 'online')

            let isConnected = false
            let connectionStatusLabel = 'DISCONNECTED (CHƯA GẮN NODE)'
            let connectionStatusColor = 'text-danger'
            let statusDotColor = 'bg-danger'

            if (isLiveStreamActive || onlineClusters.length > 0) {
              isConnected = true
              connectionStatusLabel = 'NODE ONLINE (ĐANG TRUYỀN DATA)'
              connectionStatusColor = 'text-safe'
              statusDotColor = 'bg-safe animate-pulse'
            } else if (hasClusters) {
              isConnected = false
              connectionStatusLabel = 'MẤT KẾT NỐI (OFFLINE)'
              connectionStatusColor = 'text-danger'
              statusDotColor = 'bg-danger'
            }

            const currentWater = live.waterLevel ?? st.waterLevel ?? 0
            const currentHumidity = live.humidity ?? st.humidity ?? 0
            // Biên độ rung thật (Station.vibration) — trước đây đọc nhầm st.bd3 (cột NGƯỠNG báo động).
            const currentVibration = live.vibration ?? st.vibration ?? null

            return (
              <div
                key={st.id}
                className={`bg-card border border-border border-t-2 ${stS.topBorder} rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-panel hover:-translate-y-0.5 hover:border-borderHi transition-all duration-150`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-[13px] font-bold text-tx flex items-center gap-2">
                        <span>{st.name}</span>
                        {isLiveStreamActive && (
                          <span className="px-1.5 py-0.5 bg-safe/10 border border-safe/30 text-safe text-[8px] font-mono rounded font-bold animate-pulse">
                            ● LIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                        <MapPin className="w-3 h-3 text-muted shrink-0" />
                        <span>
                          {st.latitude != null && st.longitude != null
                            ? `${st.latitude}°N, ${st.longitude}°E`
                            : (st.location || 'Chưa có tọa độ')}
                        </span>
                      </div>
                    </div>
                    <Badge status={st.status} sm />
                  </div>

                  <div className="text-[10px] text-muted mb-2 flex items-center justify-between">
                    <div><span>{st.river || 'Tuyến sông'}</span> • <Mono className="text-tx">{st.km || 'K0+000'}</Mono></div>
                    {live.timestamp && (
                      <Mono className="text-[8px] text-sky-400 font-bold">
                        {new Date(live.timestamp).toLocaleTimeString('vi-VN')}
                      </Mono>
                    )}
                  </div>

                  {/* Trạng thái kết nối thực tế của Sensor Node ở Trạm này */}
                  <div className="flex items-center justify-between py-1.5 px-2 bg-card2/80 rounded-md border border-border/40 text-[9px] mb-2">
                    <span className="text-muted text-[8px] uppercase tracking-wider font-semibold">Sensor Node:</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold ${connectionStatusColor}`}>
                        <LiveDot active={isConnected} size="sm" pulse={isConnected} />
                        <span>{connectionStatusLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Dữ liệu thu được từ Cảm biến Mực nước, Độ ẩm, Độ rung */}
                  <div className="grid grid-cols-3 gap-1 bg-card2 p-2.5 rounded-lg text-[10px] my-2 border border-border/40">
                    <div>
                      <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                        <Activity className="w-2.5 h-2.5 text-sky-400" />
                        <span>Mực nước</span>
                      </div>
                      <Mono className={`font-bold ${isConnected ? stS.text : 'text-muted'}`}>
                        {currentWater} m
                      </Mono>
                    </div>
                    <div>
                      <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                        <Droplet className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Độ ẩm</span>
                      </div>
                      <Mono className={`font-bold ${isConnected ? 'text-tx' : 'text-muted'}`}>
                        {currentHumidity}%
                      </Mono>
                    </div>
                    <div>
                      <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                        <Radio className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Độ rung</span>
                      </div>
                      <Mono className={`font-bold ${isConnected ? 'text-tx' : 'text-muted'}`}>
                        {currentVibration > 0 ? `${currentVibration} mm/s` : '--'}
                      </Mono>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-border/40">
                  <Link
                    href={`/stations/${st.id}`}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent hover:underline no-underline"
                  >
                    <span>{t('damsPage.stationDetail')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  {!isViewer && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditStationModal(st)}
                        className="p-1.5 bg-card2 border border-border rounded-lg text-accent hover:border-accent cursor-pointer transition-colors"
                        title={t('damsPage.editStation')}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: st.id, name: st.name })}
                        className="p-1.5 bg-card2 border border-border rounded-lg text-danger hover:border-danger cursor-pointer transition-colors"
                        title="Xóa Trạm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-xl text-muted text-xs shadow-panel">
          {t('damDetail.noStations')}
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── MODAL: CREATE / EDIT STATION ── */}
      <Modal
        open={stationModalOpen}
        onClose={() => setStationModalOpen(false)}
        title={editingStation ? t('damsPage.editStation') : t('damDetail.addStation')}
        icon={Radio}
        maxWidth="max-w-2xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setStationModalOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button type="submit" form="station-form" variant="primary" loading={savingStation}>
              {editingStation ? t('admin.save') : t('admin.create')}
            </Button>
          </FormActions>
        }
      >
        <form id="station-form" onSubmit={handleSaveStation} className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2.5">
            <Field label={t('admin.form.stationNameLabel')} required htmlFor="station-name">
              <TextInput
                id="station-name"
                required
                value={stationForm.name}
                onChange={e => setStationForm(p => ({ ...p, name: e.target.value }))}
                placeholder="vd: Trạm Tân Ấp 1"
              />
            </Field>

            <Field label={t('admin.form.belongToDam')}>
              <TextInput disabled value={`${dam.name} (${dam.id})`} className="font-semibold" />
            </Field>

            <Field label="Địa danh / Vị trí" htmlFor="station-location">
              <TextInput
                id="station-location"
                value={stationForm.location}
                onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hoàn Kiếm, Hà Nội"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Vĩ độ (Latitude °N)" required htmlFor="station-lat">
              <TextInput
                id="station-lat"
                type="number"
                step="0.0001"
                required
                value={stationForm.latitude}
                onChange={e => setStationForm(p => ({ ...p, latitude: e.target.value }))}
                placeholder="vd: 21.0381"
                className="font-mono"
              />
            </Field>

            <Field label="Kinh độ (Longitude °E)" required htmlFor="station-lng">
              <TextInput
                id="station-lng"
                type="number"
                step="0.0001"
                required
                value={stationForm.longitude}
                onChange={e => setStationForm(p => ({ ...p, longitude: e.target.value }))}
                placeholder="vd: 105.8492"
                className="font-mono"
              />
            </Field>

            <Field label={t('admin.form.riverLabel')} htmlFor="station-river">
              <TextInput
                id="station-river"
                value={stationForm.river}
                onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                placeholder="vd: Sông Hồng"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Field label={t('admin.form.kmLabel')} htmlFor="station-km">
              <TextInput
                id="station-km"
                value={stationForm.km}
                onChange={e => setStationForm(p => ({ ...p, km: e.target.value }))}
                placeholder="vd: K25+500"
                className="font-mono"
              />
            </Field>

          </div>

          <div className="bg-card2/60 border border-border/60 rounded-lg p-2 text-[10px] text-muted">
            Mực nước, độ ẩm, độ rung và trạng thái an toàn được hệ thống tự tính từ dữ liệu cảm biến — không nhập tay tại đây.
          </div>
        </form>
      </Modal>

      {/* ── DELETE CONFIRM MODAL ── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('admin.deleteConfirmTitle')}
        icon={AlertTriangle}
        maxWidth="max-w-md"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              {t('admin.cancel')}
            </Button>
            <Button variant="danger" loading={deletingStation} onClick={handleConfirmDelete}>
              {t('admin.confirmDelete')}
            </Button>
          </FormActions>
        }
      >
        <p className="text-[10px] text-muted m-0">{t('admin.deleteWarning')}</p>
        <p className="text-[11px] text-tx leading-relaxed bg-card2 p-3 rounded-lg border border-border">
          Xóa Trạm quan trắc <strong className="text-danger">{deleteConfirm?.name}</strong> (ID: {deleteConfirm?.id})?
        </p>
      </Modal>

      {/* ── MODAL: EDIT DAM ── */}
      <Modal
        open={damModalOpen}
        onClose={() => setDamModalOpen(false)}
        title={`Chỉnh sửa thông tin Đập thủy điện (${dam.id})`}
        icon={Database}
        maxWidth="max-w-3xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setDamModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form="dam-edit-form" variant="primary" loading={savingDam}>
              Lưu thay đổi
            </Button>
          </FormActions>
        }
      >
        <form id="dam-edit-form" onSubmit={handleSaveDam} className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2.5">
            <Field label="Mã Đập Thủy Điện (ID)">
              <TextInput disabled readOnly value={dam.id} className="font-mono cursor-not-allowed select-none" />
            </Field>

            <Field label="Tên Đập Thủy Điện" required htmlFor="dam-edit-name">
              <TextInput
                id="dam-edit-name"
                required
                value={damForm.name}
                onChange={e => setDamForm(p => ({ ...p, name: e.target.value }))}
                placeholder="vd: Đập Thủy điện Hòa Bình"
              />
            </Field>

            <Field label="Địa danh / Vị trí hành chính" htmlFor="dam-edit-location">
              <TextInput
                id="dam-edit-location"
                value={damForm.location}
                onChange={e => setDamForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hòa Bình"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Vĩ độ (Latitude °N)" required htmlFor="dam-edit-lat">
              <TextInput
                id="dam-edit-lat"
                type="number"
                step="0.0001"
                required
                value={damForm.latitude}
                onChange={e => setDamForm(p => ({ ...p, latitude: e.target.value }))}
                placeholder="vd: 20.8167"
                className="font-mono"
              />
            </Field>
            <Field label="Kinh độ (Longitude °E)" required htmlFor="dam-edit-lng">
              <TextInput
                id="dam-edit-lng"
                type="number"
                step="0.0001"
                required
                value={damForm.longitude}
                onChange={e => setDamForm(p => ({ ...p, longitude: e.target.value }))}
                placeholder="vd: 105.3265"
                className="font-mono"
              />
            </Field>
          </div>

          <div className="bg-card2/60 border border-border/60 rounded-lg p-2 text-[10px] text-muted">
            Mực nước, mức chứa và trạng thái an toàn được hệ thống tự tính từ dữ liệu cảm biến — không nhập tay tại đây.
          </div>
        </form>
      </Modal>

      {/* ── MODAL: DELETE DAM CONFIRMATION ── */}
      <Modal
        open={deleteDamConfirm}
        onClose={() => setDeleteDamConfirm(false)}
        title="Xác nhận xóa Đập Thủy Điện?"
        icon={AlertTriangle}
        maxWidth="max-w-sm"
        footer={
          <FormActions>
            <Button variant="secondary" onClick={() => setDeleteDamConfirm(false)}>
              Hủy
            </Button>
            <Button variant="danger" loading={deletingDam} onClick={handleConfirmDeleteDam}>
              Xóa vĩnh viễn
            </Button>
          </FormActions>
        }
      >
        <p className="text-xs text-muted leading-relaxed m-0">
          Bạn có chắc chắn muốn xóa đập <strong className="text-tx">{dam.name}</strong> ({dam.id}) và toàn bộ các trạm trực thuộc? Thao tác này không thể hoàn tác.
        </p>
      </Modal>

      {/* ── MODAL: THRESHOLD CONFIG FOR DAM ── */}
      <Modal
        open={thresholdModalOpen}
        onClose={() => setThresholdModalOpen(false)}
        title={`Cấu Hình Ngưỡng Báo Động & Cảnh Báo An Toàn (${dam.name})`}
        icon={Sliders}
        maxWidth="max-w-4xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setThresholdModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="threshold-form"
              loading={savingThresholds}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 shadow-lg"
            >
              Lưu Cấu Hình Ngưỡng
            </Button>
          </FormActions>
        }
      >
        <form id="threshold-form" onSubmit={handleSaveThresholds} className="space-y-2.5">

          {/* Banner Đồng bộ Realtime MQTT Jetson TX2 */}
          <div className="bg-card2 border border-amber-500/30 rounded-lg p-2 text-[10px] text-amber-300 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Ngưỡng độ rung được đồng bộ Realtime xuống Jetson TX2 qua MQTT.</span>
            </div>
            <span className="text-[9px] text-safe font-semibold bg-safe/10 border border-safe/30 px-1.5 py-0.5 rounded shrink-0">
              MQTT Sync
            </span>
          </div>

          {/* 1. Ngưỡng Mực Nước Hồ */}
          <div className="bg-card2 border border-sky-500/30 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
              <Droplet className="w-3.5 h-3.5" />
              <span>1. Ngưỡng Mực Nước Hồ (Water Level)</span>
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              <Field label="Mức BĐ1 (Chú ý)" required htmlFor="th-water-warn" className="[&_label]:!text-warning">
                <TextInput
                  id="th-water-warn"
                  type="number" step="0.1" required
                  value={thresholdForm.waterWarn}
                  onChange={e => setThresholdForm(p => ({ ...p, waterWarn: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field label="Mức BĐ2 (Báo động)" required htmlFor="th-water-alert" className="[&_label]:!text-danger">
                <TextInput
                  id="th-water-alert"
                  type="number" step="0.1" required
                  value={thresholdForm.waterAlert}
                  onChange={e => setThresholdForm(p => ({ ...p, waterAlert: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field label="Mức BĐ3 (Nguy cấp)" required htmlFor="th-water-critical" className="[&_label]:!text-red-500">
                <TextInput
                  id="th-water-critical"
                  type="number" step="0.1" required
                  value={thresholdForm.waterCritical}
                  onChange={e => setThresholdForm(p => ({ ...p, waterCritical: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field label="Chiều cao bể/đập (cm)" required htmlFor="th-tank-height">
                <TextInput
                  id="th-tank-height"
                  type="number" step="0.1" required
                  value={thresholdForm.tankHeight}
                  onChange={e => setThresholdForm(p => ({ ...p, tankHeight: e.target.value }))}
                  className="font-mono"
                />
              </Field>
            </div>
          </div>

          {/* 2. Ngưỡng Độ Rung Thân Đập */}
          <div className="bg-card2 border border-orange-500/30 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-orange-400 font-bold text-[11px]">
              <Activity className="w-3.5 h-3.5" />
              <span>2. Ngưỡng Độ Rung Thân Đập (Vibration mm/s)</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Ngưỡng Chú Ý" required htmlFor="th-vib-warn" className="[&_label]:!text-warning">
                <TextInput
                  id="th-vib-warn"
                  type="number" step="0.1" required
                  value={thresholdForm.vibWarn}
                  onChange={e => setThresholdForm(p => ({ ...p, vibWarn: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field label="Ngưỡng Cảnh Báo AI" required htmlFor="th-vib-alert" className="[&_label]:!text-danger">
                <TextInput
                  id="th-vib-alert"
                  type="number" step="0.1" required
                  value={thresholdForm.vibAlert}
                  onChange={e => setThresholdForm(p => ({ ...p, vibAlert: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field label="Ngưỡng Nguy Cấp" required htmlFor="th-vib-critical" className="[&_label]:!text-red-500">
                <TextInput
                  id="th-vib-critical"
                  type="number" step="0.1" required
                  value={thresholdForm.vibCritical}
                  onChange={e => setThresholdForm(p => ({ ...p, vibCritical: e.target.value }))}
                  className="font-mono"
                />
              </Field>
            </div>
          </div>

          {/* 3. Ngưỡng Độ Ẩm Rò Rỉ Móng */}
          <div className="bg-card2 border border-emerald-500/30 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
              <Droplet className="w-3.5 h-3.5" />
              <span>3. Ngưỡng Độ Ẩm Móng Đập (Moisture %)</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <Field label="Ngưỡng Chú Ý" required htmlFor="th-mst-warn" className="[&_label]:!text-warning">
                <TextInput
                  id="th-mst-warn"
                  type="number" step="1" required
                  value={thresholdForm.mstWarn}
                  onChange={e => setThresholdForm(p => ({ ...p, mstWarn: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field label="Ngưỡng Cảnh Báo" required htmlFor="th-mst-alert" className="[&_label]:!text-danger">
                <TextInput
                  id="th-mst-alert"
                  type="number" step="1" required
                  value={thresholdForm.mstAlert}
                  onChange={e => setThresholdForm(p => ({ ...p, mstAlert: e.target.value }))}
                  className="font-mono"
                />
              </Field>
              <Field label="Ngưỡng Nguy Cấp" required htmlFor="th-mst-critical" className="[&_label]:!text-red-500">
                <TextInput
                  id="th-mst-critical"
                  type="number" step="1" required
                  value={thresholdForm.mstCritical}
                  onChange={e => setThresholdForm(p => ({ ...p, mstCritical: e.target.value }))}
                  className="font-mono"
                />
              </Field>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
