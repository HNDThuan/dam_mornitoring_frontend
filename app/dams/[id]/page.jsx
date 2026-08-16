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
  Map as MapIcon,
} from 'lucide-react'
import { fetchNodes, updateNode } from '@/lib/api'
import DamMap from '@/components/DamMap'
import LocationPickerMap from '@/components/LocationPickerMap'

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

  // Modals state for Stations
  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [savingStation, setSavingStation] = useState(false)
  const [deletingStation, setDeletingStation] = useState(false)

  const damId = String(id)
  // Fallback khi chưa tải xong / không tìm thấy: KHÔNG bịa số đo, để 0 + trạng thái 'unknown'
  // thay vì hiển thị số liệu giả trông như thật.
  const dam = dams.find(d => d.damId === damId) || {
    damId,
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
  const [damEditErrors, setDamEditErrors] = useState({})

  const validateDamEditForm = () => {
    const errs = {}
    if (!damForm.name || !damForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên đập thủy điện'
    } else if (damForm.name.trim().length < 3) {
      errs.name = 'Tên đập phải có ít nhất 3 ký tự'
    }

    const lat = Number(damForm.latitude)
    if (damForm.latitude === '' || isNaN(lat)) {
      errs.latitude = 'Vui lòng nhập vĩ độ hợp lệ'
    } else if (lat < -90 || lat > 90) {
      errs.latitude = 'Vĩ độ phải từ -90° đến 90°'
    }

    const lng = Number(damForm.longitude)
    if (damForm.longitude === '' || isNaN(lng)) {
      errs.longitude = 'Vui lòng nhập kinh độ hợp lệ'
    } else if (lng < -180 || lng > 180) {
      errs.longitude = 'Kinh độ phải từ -180° đến 180°'
    }

    setDamEditErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openEditDamModal = () => {
    setDamEditErrors({})
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
    if (!validateDamEditForm()) return

    try {
      setSavingDam(true)
      await updateDam(dam.damId, {
        name: damForm.name.trim(),
        location: damForm.location.trim(),
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
      await deleteDam(dam.damId)
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

  // Form state for Station
  const [stationForm, setStationForm] = useState({
    name: '',
    location: '',
    latitude: 21.0381,
    longitude: 105.8492,
    river: '',
    km: '',
    damId: damId,
  })
  const [stationErrors, setStationErrors] = useState({})

  const validateStationForm = () => {
    const errs = {}
    if (!stationForm.name || !stationForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên trạm quan trắc'
    } else if (stationForm.name.trim().length < 3) {
      errs.name = 'Tên trạm phải có ít nhất 3 ký tự'
    } else {
      const isDuplicate = damStations.some(
        s => s.name.trim().toLowerCase() === stationForm.name.trim().toLowerCase() && s.stationId !== editingStation?.stationId
      )
      if (isDuplicate) {
        errs.name = 'Trạm quan trắc với tên này đã tồn tại trên đập này!'
      }
    }

    const lat = Number(stationForm.latitude)
    if (stationForm.latitude === '' || isNaN(lat)) {
      errs.latitude = 'Vui lòng nhập vĩ độ hợp lệ'
    } else if (lat < -90 || lat > 90) {
      errs.latitude = 'Vĩ độ phải từ -90° đến 90°'
    }

    const lng = Number(stationForm.longitude)
    if (stationForm.longitude === '' || isNaN(lng)) {
      errs.longitude = 'Vui lòng nhập kinh độ hợp lệ'
    } else if (lng < -180 || lng > 180) {
      errs.longitude = 'Kinh độ phải từ -180° đến 180°'
    }

    setStationErrors(errs)
    return Object.keys(errs).length === 0
  }

  const openCreateStationModal = () => {
    setEditingStation(null)
    setStationErrors({})
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
    setStationErrors({})
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
    if (!validateStationForm()) return

    try {
      setSavingStation(true)
      if (editingStation) {
        await updateStation(editingStation.stationId, {
          name: stationForm.name.trim(),
          location: stationForm.location.trim(),
          latitude: Number(stationForm.latitude),
          longitude: Number(stationForm.longitude),
          river: stationForm.river.trim(),
          km: stationForm.km.trim(),
          damId: damId,
        })
        showToast('Cập nhật trạm quan trắc thành công!', 'success')
      } else {
        await createStation({
          ...stationForm,
          name: stationForm.name.trim(),
          location: stationForm.location.trim(),
          river: stationForm.river.trim(),
          km: stationForm.km.trim(),
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
                {dam.damId}
              </span>
              <h1 className="text-xl font-bold text-tx tracking-wide m-0">{dam.name}</h1>
              <Badge status={dam.status} title={dam.statusReason} />
            </div>
            {dam.location && (
              <div className="text-[11px] text-muted flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{dam.location}</span>
              </div>
            )}
            {dam.statusReason && (
              <div className={`mt-2 text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono ${
                dam.status === 'safe'
                  ? 'bg-safe/5 text-safe/90 border-safe/20'
                  : dam.status === 'unknown'
                    ? 'bg-card2 text-muted border-border/50'
                    : 'bg-danger/10 text-danger border-danger/30 font-semibold'
              }`}>
                <span className="shrink-0">ⓘ</span>
                <span><strong>Lý do:</strong> {dam.statusReason}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
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
            <MapIcon className="w-3 h-3" /> Bản đồ giám sát
          </span>
        }
        right={<span className="flex items-center gap-1.5"><LiveDot active /><span className="text-[10px] font-mono text-safe font-bold">LIVE</span></span>}
        bodyClassName="p-0"
        className="[&_.leaflet-container]:rounded-b-xl"
      >
        <DamMap dams={[dam]} stations={damStations} selectedDamId={dam.damId} height="320px" />
      </Panel>

      {/* Stations Grid */}
      {damStations.length > 0 ? (
        <div className="grid grid-cols-3 gap-3.5">
          {damStations.map(st => {
            const gateways = st.gateways || []
            const allNodes = gateways.flatMap(g => g.nodes || [])
            const hasNodes = allNodes.length > 0
            const onlineNodes = allNodes.filter(n => n.status === 'online')

            const live = liveStationMap[st.stationId] || {}
            const isLiveStreamActive = Boolean(live.timestamp) && hasNodes

            let isConnected = false
            let connectionStatusLabel = 'CHƯA GẮN SENSOR NODE'
            let connectionStatusColor = 'text-muted'

            if (isLiveStreamActive || onlineNodes.length > 0) {
              isConnected = true
              connectionStatusLabel = 'SENSOR NODE ONLINE'
              connectionStatusColor = 'text-safe'
            } else if (hasNodes) {
              isConnected = false
              connectionStatusLabel = 'MẤT KẾT NỐI (OFFLINE)'
              connectionStatusColor = 'text-danger'
            }

            const effectiveStatus = hasNodes ? (st.status || 'unknown') : 'unknown'
            const effectiveStatusReason = hasNodes 
              ? (st.statusReason || '') 
              : (st.status === 'unknown' && st.statusReason ? st.statusReason : 'Chưa gắn Sensor Node vào trạm')
            const stS = getStatus(effectiveStatus)

            const currentWater = hasNodes && (isLiveStreamActive || isConnected || st.waterLevel > 0) ? (live.waterLevel ?? st.waterLevel ?? 0) : null
            const currentHumidity = hasNodes && (isLiveStreamActive || isConnected || st.humidity > 0) ? (live.humidity ?? st.humidity ?? 0) : null
            const currentVibration = hasNodes && (isLiveStreamActive || isConnected || st.vibration > 0) ? (live.vibration ?? st.vibration ?? null) : null

            const isWaterBreached = effectiveStatusReason?.toLowerCase().includes('mực nước')
            const isHumidBreached = effectiveStatusReason?.toLowerCase().includes('độ ẩm')
            const isVibBreached = effectiveStatusReason?.toLowerCase().includes('độ rung')

            return (
              <div
                key={st.stationId}
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
                    <Badge status={effectiveStatus} sm title={effectiveStatusReason} />
                  </div>

                  <div className="text-[10px] text-muted mb-2 flex items-center justify-between">
                    <div><span>{st.river || 'Tuyến sông'}</span> • <Mono className="text-tx">{st.km || 'K0+000'}</Mono></div>
                    {live.timestamp && hasNodes && (
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

                  {/* Dòng hiển thị nguyên nhân trạng thái an toàn */}
                  {effectiveStatusReason && (
                    <div className={`text-[9px] px-2 py-1 rounded-md border flex items-start gap-1 mb-2 font-mono ${
                      effectiveStatus === 'safe'
                        ? 'bg-safe/5 text-safe/90 border-safe/20'
                        : effectiveStatus === 'unknown'
                          ? 'bg-card2/70 text-muted border-border/40'
                          : 'bg-danger/10 text-danger border-danger/30 font-semibold'
                    }`}>
                      <span className="shrink-0">ⓘ</span>
                      <span className="leading-tight">{effectiveStatusReason}</span>
                    </div>
                  )}

                  {/* Dữ liệu thu được từ Cảm biến Mực nước, Độ ẩm, Độ rung */}
                  <div className="grid grid-cols-3 gap-1 bg-card2 p-2.5 rounded-lg text-[10px] my-2 border border-border/40">
                    <div className={`p-1 rounded ${isWaterBreached ? 'bg-danger/10 border border-danger/40' : ''}`}>
                      <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                        <Activity className="w-2.5 h-2.5 text-sky-400" />
                        <span>Mực nước</span>
                      </div>
                      <Mono className={`font-bold ${isWaterBreached ? 'text-danger' : currentWater != null ? stS.text : 'text-muted'}`}>
                        {currentWater != null ? `${currentWater} m` : '--'}
                      </Mono>
                    </div>
                    <div className={`p-1 rounded ${isHumidBreached ? 'bg-danger/10 border border-danger/40' : ''}`}>
                      <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                        <Droplet className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Độ ẩm</span>
                      </div>
                      <Mono className={`font-bold ${isHumidBreached ? 'text-danger' : currentHumidity != null ? 'text-tx' : 'text-muted'}`}>
                        {currentHumidity != null ? `${currentHumidity}%` : '--'}
                      </Mono>
                    </div>
                    <div className={`p-1 rounded ${isVibBreached ? 'bg-danger/10 border border-danger/40' : ''}`}>
                      <div className="text-[7px] text-muted uppercase flex items-center gap-0.5 mb-0.5">
                        <Radio className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Độ rung</span>
                      </div>
                      <Mono className={`font-bold ${currentVibration != null ? 'text-tx' : 'text-muted'}`}>
                        {currentVibration != null && currentVibration > 0 ? `${currentVibration} mm/s` : '--'}
                      </Mono>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-border/40">
                  <Link
                    href={`/stations/${st.stationId}`}
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
                        onClick={() => setDeleteConfirm({ id: st.stationId, name: st.name })}
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

      {/* ── MODAL: CREATE / EDIT STATION (SPLIT-VIEW) ── */}
      <Modal
        open={stationModalOpen}
        onClose={() => setStationModalOpen(false)}
        title={editingStation ? t('damsPage.editStation') : t('damDetail.addStation')}
        icon={Radio}
        maxWidth="max-w-4xl"
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* CỘT TRÁI: Form nhập liệu */}
          <form id="station-form" onSubmit={handleSaveStation} className="md:col-span-6 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('admin.form.stationNameLabel')} required error={stationErrors.name} htmlFor="station-name">
                <TextInput
                  id="station-name"
                  required
                  autoFocus
                  error={stationErrors.name}
                  value={stationForm.name}
                  onChange={e => {
                    setStationForm(p => ({ ...p, name: e.target.value }))
                    if (stationErrors.name) setStationErrors(p => ({ ...p, name: null }))
                  }}
                  placeholder="vd: Trạm Tân Ấp 1"
                />
              </Field>

              <Field label={t('admin.form.belongToDam')}>
                <TextInput disabled value={`${dam.name} (${dam.damId})`} className="font-semibold text-xs" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Field label={t('admin.form.riverLabel')} htmlFor="station-river">
                <TextInput
                  id="station-river"
                  value={stationForm.river}
                  onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                  placeholder="vd: Sông Hồng"
                />
              </Field>

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

            <Field label="Địa danh / Vị trí trạm" htmlFor="station-location">
              <TextInput
                id="station-location"
                value={stationForm.location}
                onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hoàn Kiếm, Hà Nội"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field label="Vĩ độ (Latitude °N)" required error={stationErrors.latitude} htmlFor="station-lat">
                <TextInput
                  id="station-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.latitude}
                  value={stationForm.latitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, latitude: e.target.value }))
                    if (stationErrors.latitude) setStationErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 21.0381"
                  className="font-mono"
                />
              </Field>

              <Field label="Kinh độ (Longitude °E)" required error={stationErrors.longitude} htmlFor="station-lng">
                <TextInput
                  id="station-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={stationErrors.longitude}
                  value={stationForm.longitude}
                  onChange={e => {
                    setStationForm(p => ({ ...p, longitude: e.target.value }))
                    if (stationErrors.longitude) setStationErrors(p => ({ ...p, longitude: null }))
                  }}
                  placeholder="vd: 105.8492"
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="bg-card2/60 border border-border/60 rounded-lg p-2 text-[10px] text-muted">
              Mực nước, độ ẩm, độ rung và trạng thái an toàn được hệ thống tự tính từ dữ liệu cảm biến — không nhập tay tại đây.
            </div>
          </form>

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview Card */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-bold text-tx mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Bản đồ chọn tọa độ GIS (Click hoặc kéo ghim)</span>
              </label>
              <LocationPickerMap
                latitude={stationForm.latitude}
                longitude={stationForm.longitude}
                onChange={({ latitude, longitude }) => setStationForm(p => ({ ...p, latitude, longitude }))}
                defaultCenter={[dam.latitude ?? 21.0381, dam.longitude ?? 105.8492]}
                height="190px"
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Xem trước thẻ trạm (Live Preview):</span>
                <span className="text-accent text-[9px] font-mono">Tự động cập nhật</span>
              </div>
              <div className="bg-card2 border border-border border-t-2 border-t-sky-500 rounded-xl p-3 shadow-panel">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-bold text-tx truncate m-0">
                      {stationForm.name || 'Tên Trạm Quan Trắc'}
                    </h4>
                    <div className="text-[9px] text-muted flex items-center gap-1 mt-0.5 font-mono">
                      <MapPin className="w-3 h-3 text-muted shrink-0" />
                      <span className="truncate">
                        {stationForm.latitude && stationForm.longitude
                          ? `${Number(stationForm.latitude).toFixed(4)}°N, ${Number(stationForm.longitude).toFixed(4)}°E`
                          : (stationForm.location || 'Chưa có tọa độ')}
                      </span>
                    </div>
                  </div>
                  <Badge status={editingStation ? editingStation.status : 'unknown'} sm />
                </div>
                <div className="text-[10px] text-muted mb-1.5 flex items-center justify-between">
                  <div><span>{stationForm.river || 'Tuyến sông'}</span> • <Mono className="text-tx">{stationForm.km || 'K0+000'}</Mono></div>
                </div>
                <div className="flex items-center justify-between py-1 px-2 bg-card3 rounded border border-border/40 text-[8px] font-mono text-muted">
                  <span>SENSOR NODE:</span>
                  <span className="text-muted font-bold">CHƯA GẮN SENSOR NODE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      {/* ── MODAL: EDIT DAM (SPLIT-VIEW) ── */}
      <Modal
        open={damModalOpen}
        onClose={() => setDamModalOpen(false)}
        title={`Chỉnh sửa thông tin Đập thủy điện (${dam.damId})`}
        icon={Database}
        maxWidth="max-w-4xl"
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <form id="dam-edit-form" onSubmit={handleSaveDam} className="md:col-span-6 space-y-3">
            <Field label="Mã Đập Thủy Điện (ID)">
              <TextInput disabled readOnly value={dam.damId} className="font-mono cursor-not-allowed select-none" />
            </Field>

            <Field label="Tên Đập Thủy Điện" required error={damEditErrors.name} htmlFor="dam-edit-name">
              <TextInput
                id="dam-edit-name"
                required
                autoFocus
                error={damEditErrors.name}
                value={damForm.name}
                onChange={e => {
                  setDamForm(p => ({ ...p, name: e.target.value }))
                  if (damEditErrors.name) setDamEditErrors(p => ({ ...p, name: null }))
                }}
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

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Vĩ độ (Latitude °N)" required error={damEditErrors.latitude} htmlFor="dam-edit-lat">
                <TextInput
                  id="dam-edit-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={damEditErrors.latitude}
                  value={damForm.latitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, latitude: e.target.value }))
                    if (damEditErrors.latitude) setDamEditErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 20.8167"
                  className="font-mono"
                />
              </Field>
              <Field label="Kinh độ (Longitude °E)" required error={damEditErrors.longitude} htmlFor="dam-edit-lng">
                <TextInput
                  id="dam-edit-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={damEditErrors.longitude}
                  value={damForm.longitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, longitude: e.target.value }))
                    if (damEditErrors.longitude) setDamEditErrors(p => ({ ...p, longitude: null }))
                  }}
                  placeholder="vd: 105.3265"
                  className="font-mono"
                />
              </Field>
            </div>

            <div className="bg-card2/60 border border-border/60 rounded-lg p-2 text-[10px] text-muted">
              Mực nước, mức chứa và trạng thái an toàn được hệ thống tự tính từ dữ liệu cảm biến — không nhập tay tại đây.
            </div>
          </form>

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview */}
          <div className="md:col-span-6 space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-[11px] font-bold text-tx mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                <span>Bản đồ chọn tọa độ GIS (Click hoặc kéo ghim)</span>
              </label>
              <LocationPickerMap
                latitude={damForm.latitude}
                longitude={damForm.longitude}
                onChange={({ latitude, longitude }) => setDamForm(p => ({ ...p, latitude, longitude }))}
                height="190px"
              />
            </div>

            {/* Live Preview Card */}
            <div>
              <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Xem trước thẻ đập (Live Preview):</span>
                <span className="text-accent text-[9px] font-mono">Tự động cập nhật</span>
              </div>
              <div className="bg-card2 border border-border border-l-4 border-l-safe rounded-xl p-3 shadow-panel">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[9px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        {dam.damId}
                      </span>
                      <h4 className="text-sm font-bold text-tx truncate m-0">
                        {damForm.name || dam.name}
                      </h4>
                    </div>
                    <div className="text-[9px] text-muted flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-muted shrink-0" />
                      <span className="truncate">
                        {damForm.latitude && damForm.longitude
                          ? `${Number(damForm.latitude).toFixed(4)}°N, ${Number(damForm.longitude).toFixed(4)}°E`
                          : 'Chưa có tọa độ'}
                        {damForm.location ? ` (${damForm.location})` : ''}
                      </span>
                    </div>
                  </div>
                  <Badge status={dam.status} sm title={dam.statusReason} />
                </div>
              </div>
            </div>
          </div>
        </div>
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
          Bạn có chắc chắn muốn xóa đập <strong className="text-tx">{dam.name}</strong> ({dam.damId}) và toàn bộ các trạm trực thuộc? Thao tác này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  )
}
