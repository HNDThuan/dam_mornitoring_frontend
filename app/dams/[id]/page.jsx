'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { getSocket } from '@/lib/socket'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Label } from '@/components/ui'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ChevronRight,
  X,
  AlertTriangle,
  Database,
  Radio,
  MapPin,
  ExternalLink,
  ArrowLeft,
  Droplet,
  Activity
} from 'lucide-react'
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
  const [damForm, setDamForm] = useState({
    name: '',
    location: '',
    latitude: 20.8167,
    longitude: 105.3265,
    waterLevel: 0,
    flow: 0,
    fillPct: 50,
    status: 'safe',
    cameraUrl: '',
  })

  // Modals state for Stations
  const [stationModalOpen, setStationModalOpen] = useState(false)
  const [editingStation, setEditingStation] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }

  const damId = String(id)
  const dam = dams.find(d => d.id === damId) || {
    id: damId,
    name: `Đập ${damId}`,
    location: 'Hòa Bình',
    waterLevel: 105.2,
    flow: 1200,
    fillPct: 78,
    status: 'safe',
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
      waterLevel: dam.waterLevel || 0,
      flow: dam.flow || 0,
      fillPct: dam.fillPct || 0,
      status: dam.status || 'safe',
      cameraUrl: dam.cameraUrl || '',
    })
    setDamModalOpen(true)
  }

  const handleSaveDam = async (e) => {
    e.preventDefault()
    try {
      await updateDam(dam.id, {
        name: damForm.name,
        location: damForm.location,
        latitude: Number(damForm.latitude),
        longitude: Number(damForm.longitude),
        waterLevel: Number(damForm.waterLevel),
        flow: Number(damForm.flow),
        fillPct: Number(damForm.fillPct),
        status: damForm.status,
        cameraUrl: damForm.cameraUrl,
      })
      showToast('Cập nhật thông tin đập thành công!', 'success')
      setDamModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleConfirmDeleteDam = async () => {
    try {
      await deleteDam(dam.id)
      showToast(`Đã xóa đập thủy điện ${dam.name}!`, 'success')
      setDeleteDamConfirm(false)
      setTimeout(() => {
        router.push('/dams')
      }, 1000)
    } catch (err) {
      showToast(`Lỗi khi xóa đập: ${err.message}`, 'error')
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
    status: 'safe',
    waterLevel: 0,
    change: 0,
    pressure: 0,
    flow: 0,
    humidity: 50,
    bd1: 6.0,
    bd2: 8.0,
    bd3: 10.0,
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
      status: 'safe',
      waterLevel: 5.0,
      change: 0,
      pressure: 150,
      flow: 1200,
      humidity: 50,
      bd1: 6.0,
      bd2: 8.0,
      bd3: 10.0,
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
      status: st.status || 'safe',
      waterLevel: st.waterLevel || 0,
      change: st.change || 0,
      pressure: st.pressure || 0,
      flow: st.flow || 0,
      humidity: st.humidity || 0,
      bd1: st.bd1 || 0,
      bd2: st.bd2 || 0,
      bd3: st.bd3 || 0,
      damId: st.damId || damId,
    })
    setStationModalOpen(true)
  }

  const handleSaveStation = async (e) => {
    e.preventDefault()
    try {
      if (editingStation) {
        await updateStation(editingStation.id, {
          name: stationForm.name,
          location: stationForm.location,
          latitude: Number(stationForm.latitude),
          longitude: Number(stationForm.longitude),
          river: stationForm.river,
          km: stationForm.km,
          status: stationForm.status,
          waterLevel: Number(stationForm.waterLevel),
          change: Number(stationForm.change),
          pressure: Number(stationForm.pressure),
          flow: Number(stationForm.flow),
          humidity: Number(stationForm.humidity),
          bd1: Number(stationForm.bd1),
          bd2: Number(stationForm.bd2),
          bd3: Number(stationForm.bd3),
          damId: damId,
        })
        showToast('Cập nhật trạm quan trắc thành công!', 'success')
      } else {
        await createStation({
          ...stationForm,
          latitude: Number(stationForm.latitude),
          longitude: Number(stationForm.longitude),
          waterLevel: Number(stationForm.waterLevel),
          change: Number(stationForm.change),
          pressure: Number(stationForm.pressure),
          flow: Number(stationForm.flow),
          humidity: Number(stationForm.humidity),
          bd1: Number(stationForm.bd1),
          bd2: Number(stationForm.bd2),
          bd3: Number(stationForm.bd3),
          damId: damId,
        })
        showToast(`Tạo trạm "${stationForm.name}" thành công!`, 'success')
      }
      setStationModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteStation(deleteConfirm.id)
      showToast(`Đã xóa trạm ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      refetch(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
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
      <div className={`bg-card border border-border border-l-4 ${damStatus.leftBorder} rounded-xl p-5 shadow-lg`}>
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

            <div className="flex gap-4 bg-card2 border border-border rounded-xl p-3">
            <div>
              <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.waterLevel')}</div>
              <Mono className={`text-base font-bold ${damStatus.text}`}>{dam.waterLevel} m</Mono>
            </div>
            <Divider vertical />
            <div>
              <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.flow')}</div>
              <Mono className="text-sm font-semibold text-tx">{dam.flow ? dam.flow.toLocaleString() : 0} m³/s</Mono>
            </div>
            <Divider vertical />
            <div>
              <div className="text-[8px] text-muted uppercase tracking-wide mb-0.5">{t('damsPage.fillCapacity')}</div>
              <Mono className="text-sm font-semibold text-tx">{dam.fillPct}%</Mono>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Top Header Actions for Stations */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold text-tx m-0 tracking-wide uppercase">
            {t('damDetail.title', { name: dam.name })} ({damStations.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-1.5 bg-card2 border border-border rounded-lg px-3 py-1.5 w-56">
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-sky-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{t('damDetail.addStation')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE LEAFLET GIS MAP ── */}
      <DamMap dams={[dam]} stations={damStations} selectedDamId={dam.id} height="320px" />

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
            const currentVibration = live.vibration ?? (st.bd3 != null && st.bd3 > 0 ? st.bd3 : (st.vibration ?? 0))

            return (
              <div
                key={st.id}
                className={`bg-card border border-border border-t-2 ${stS.topBorder} rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-lg hover:-translate-y-px transition-all`}
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
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold ${connectionStatusColor}`}>
                        <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
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
        <div className="text-center py-12 bg-card border border-border rounded-xl text-muted text-xs shadow-md">
          {t('damDetail.noStations')}
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className={`fixed top-14 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
          toast.type === 'error'
            ? 'bg-danger/20 border-danger/40 text-danger shadow-danger/10'
            : 'bg-safe/20 border-safe/40 text-safe shadow-safe/10'
        }`}>
          <span className="text-[12px]">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-muted hover:text-tx bg-transparent border-none cursor-pointer p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT STATION ── */}
      {stationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Radio className="w-4 h-4 text-accent" />
                <span>{editingStation ? t('damsPage.editStation') : t('damDetail.addStation')}</span>
              </h3>
              <button
                onClick={() => setStationModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="p-5 space-y-3 text-[11px]">
              <div>
                <Label className="mb-1">{t('admin.form.belongToDam')}</Label>
                <input
                  disabled
                  value={`${dam.name} (${dam.id})`}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none font-semibold opacity-70"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.stationNameLabel')}</Label>
                  <input
                    required
                    value={stationForm.name}
                    onChange={e => setStationForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="vd: Trạm Tân Ấp 1"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <Label className="mb-1">Địa danh / Vị trí</Label>
                  <input
                    value={stationForm.location}
                    onChange={e => setStationForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="vd: Hoàn Kiếm, Hà Nội"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">Vĩ độ (Latitude °N)</Label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={stationForm.latitude}
                    onChange={e => setStationForm(p => ({ ...p, latitude: e.target.value }))}
                    placeholder="vd: 21.0381"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">Kinh độ (Longitude °E)</Label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={stationForm.longitude}
                    onChange={e => setStationForm(p => ({ ...p, longitude: e.target.value }))}
                    placeholder="vd: 105.8492"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.riverLabel')}</Label>
                  <input
                    value={stationForm.river}
                    onChange={e => setStationForm(p => ({ ...p, river: e.target.value }))}
                    placeholder="vd: Sông Hồng"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.kmLabel')}</Label>
                  <input
                    value={stationForm.km}
                    onChange={e => setStationForm(p => ({ ...p, km: e.target.value }))}
                    placeholder="vd: K25+500"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.waterLevelLabel')}</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={stationForm.waterLevel}
                    onChange={e => setStationForm(p => ({ ...p, waterLevel: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.changeLabel')}</Label>
                  <input
                    type="number"
                    step="0.01"
                    value={stationForm.change}
                    onChange={e => setStationForm(p => ({ ...p, change: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.pressureLabel')}</Label>
                  <input
                    type="number"
                    step="1"
                    value={stationForm.pressure}
                    onChange={e => setStationForm(p => ({ ...p, pressure: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="mb-1">{t('admin.form.bd1Label')}</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd1}
                    onChange={e => setStationForm(p => ({ ...p, bd1: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.bd2Label')}</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd2}
                    onChange={e => setStationForm(p => ({ ...p, bd2: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <Label className="mb-1">{t('admin.form.bd3Label')}</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={stationForm.bd3}
                    onChange={e => setStationForm(p => ({ ...p, bd3: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono text-danger font-bold"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">{t('admin.form.statusLabel')}</Label>
                <select
                  value={stationForm.status}
                  onChange={e => setStationForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                >
                  <option value="safe">{t('status.safe')}</option>
                  <option value="warning">{t('status.warning')}</option>
                  <option value="danger">{t('status.danger')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setStationModalOpen(false)}
                  className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded text-white text-[11px] font-bold cursor-pointer border-none"
                >
                  {editingStation ? t('admin.save') : t('admin.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-3 text-danger">
              <div className="w-10 h-10 rounded-full bg-danger/10 border border-danger/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-tx m-0">{t('admin.deleteConfirmTitle')}</h3>
                <p className="text-[10px] text-muted m-0">{t('admin.deleteWarning')}</p>
              </div>
            </div>

            <p className="text-[11px] text-tx leading-relaxed mb-4 bg-card2 p-3 rounded border border-border">
              Xóa Trạm quan trắc <strong className="text-danger">{deleteConfirm.name}</strong> (ID: {deleteConfirm.id})?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-border rounded text-muted bg-transparent text-[11px] font-semibold cursor-pointer hover:bg-white/5"
              >
                {t('admin.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-danger rounded text-white text-[11px] font-bold cursor-pointer border-none shadow-lg shadow-danger/20"
              >
                {t('admin.confirmDelete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT DAM ── */}
      {damModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-card2">
              <h3 className="text-sm font-bold text-tx m-0 flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                <span>Chỉnh sửa thông tin Đập thủy điện ({dam.id})</span>
              </h3>
              <button
                onClick={() => setDamModalOpen(false)}
                className="text-muted hover:text-tx bg-transparent border-none cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDam} className="p-5 space-y-3 text-[11px]">
              <div>
                <Label className="mb-1">Mã Đập Thủy Điện (ID)</Label>
                <input
                  disabled
                  readOnly
                  value={dam.id}
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-muted outline-none opacity-70 font-mono cursor-not-allowed select-none"
                />
              </div>

              <div>
                <Label className="mb-1">Tên Đập Thủy Điện</Label>
                <input
                  required
                  value={damForm.name}
                  onChange={e => setDamForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="vd: Đập Thủy điện Hòa Bình"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="mb-1">Vĩ độ (Latitude °N)</Label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={damForm.latitude}
                    onChange={e => setDamForm(p => ({ ...p, latitude: e.target.value }))}
                    placeholder="vd: 20.8167"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Kinh độ (Longitude °E)</Label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={damForm.longitude}
                    onChange={e => setDamForm(p => ({ ...p, longitude: e.target.value }))}
                    placeholder="vd: 105.3265"
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">Địa danh / Vị trí hành chính</Label>
                <input
                  value={damForm.location}
                  onChange={e => setDamForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="vd: Hòa Bình"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="mb-1">Mực nước (m)</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={damForm.waterLevel}
                    onChange={e => setDamForm(p => ({ ...p, waterLevel: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Lưu lượng (m3/s)</Label>
                  <input
                    type="number"
                    value={damForm.flow}
                    onChange={e => setDamForm(p => ({ ...p, flow: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
                <div>
                  <Label className="mb-1">Dung tích (%)</Label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={damForm.fillPct}
                    onChange={e => setDamForm(p => ({ ...p, fillPct: e.target.value }))}
                    className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div>
                <Label className="mb-1">{t('admin.form.cameraUrlLabel')}</Label>
                <input
                  type="text"
                  value={damForm.cameraUrl}
                  onChange={e => setDamForm(p => ({ ...p, cameraUrl: e.target.value }))}
                  placeholder="vd: http://192.168.1.50:8000"
                  className="w-full bg-card2 border border-border rounded px-3 py-2 text-tx outline-none focus:border-accent font-mono text-[12px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDamModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg text-muted hover:text-tx text-xs font-semibold bg-transparent cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg text-white text-xs font-bold border-none cursor-pointer shadow-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE DAM CONFIRMATION ── */}
      {deleteDamConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-center animate-in fade-in zoom-in duration-150">
            <div className="w-12 h-12 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-tx mb-2">Xác nhận xóa Đập Thủy Điện?</h3>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa đập <strong className="text-tx">{dam.name}</strong> ({dam.id}) và toàn bộ các trạm trực thuộc? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeleteDamConfirm(false)}
                className="px-4 py-2 border border-border rounded-lg text-muted hover:text-tx text-xs font-semibold bg-card2 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDeleteDam}
                className="px-4 py-2 bg-danger hover:bg-danger/80 text-white rounded-lg text-xs font-bold border-none cursor-pointer shadow-lg shadow-danger/20"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
