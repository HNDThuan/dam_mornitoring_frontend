'use client'

import { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDamData } from '@/hooks/useDamData'
import { useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { getStatus } from '@/lib/statusConfig'
import { Mono, Badge, Divider, Panel, RadialGauge, LiveDot } from '@/components/ui'
import { Field, TextInput, Select, Modal, FormActions, Button, Toast } from '@/components/form'
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Database,
  Radio,
  MapPin,
  Lock,
  Map as MapIcon,
  Eye,
  EyeOff,
  Layers,
} from 'lucide-react'
import DamPinMap from '@/components/DamMap'
import LocationPickerMap from '@/components/LocationPickerMap'

export default function DamsPage() {
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
  } = useDamData()
  const { t } = useLanguage()
  const { isAdmin, isOperator, assignedDamId } = useAuth()

  const [search, setSearch] = useState('')
  const [showMap, setShowMap] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'safe' | 'warning' | 'critical'
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [damModalOpen, setDamModalOpen] = useState(false)
  const [editingDam, setEditingDam] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // { id, name }
  const [savingDam, setSavingDam] = useState(false)
  const [deletingDam, setDeletingDam] = useState(false)

  // Toast State
  const [toast, setToast] = useState(null) // { message: string, type: 'success' | 'error' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Form states
  // Chỉ chứa thông tin tĩnh do người dùng nhập. Mực nước / mức chứa / trạng thái an toàn
  // đều do backend tự tính từ cảm biến nên không đưa vào form (sửa tay sẽ bị ghi đè ngay).
  const [damForm, setDamForm] = useState({
    id: '',
    name: '',
    location: '',
    latitude: 20.8167,
    longitude: 105.3265,
    cameraUrl: '',
  })
  const [damErrors, setDamErrors] = useState({})

  const validateDamForm = () => {
    const errs = {}
    if (!damForm.name || !damForm.name.trim()) {
      errs.name = 'Vui lòng nhập tên đập thủy điện'
    } else if (damForm.name.trim().length < 3) {
      errs.name = 'Tên đập phải có ít nhất 3 ký tự'
    } else {
      const isDuplicate = dams.some(
        d => d.name.trim().toLowerCase() === damForm.name.trim().toLowerCase() && d.damId !== editingDam?.damId
      )
      if (isDuplicate) {
        errs.name = 'Tên đập thủy điện này đã tồn tại trên hệ thống'
      }
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

    setDamErrors(errs)
    return Object.keys(errs).length === 0
  }

  // Dam Form Handlers
  const openCreateDamModal = () => {
    setEditingDam(null)
    setDamErrors({})
    setDamForm({
      id: '',
      name: '',
      location: '',
      latitude: 20.8167,
      longitude: 105.3265,
      cameraUrl: '',
    })
    setDamModalOpen(true)
  }

  const openEditDamModal = (dam, e) => {
    e?.stopPropagation()
    setEditingDam(dam)
    setDamErrors({})
    setDamForm({
      id: dam.damId,
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
    if (!validateDamForm()) return

    try {
      setSavingDam(true)
      if (editingDam) {
        await updateDam(editingDam.damId, {
          name: damForm.name.trim(),
          location: damForm.location.trim(),
          latitude: Number(damForm.latitude),
          longitude: Number(damForm.longitude),
          cameraUrl: damForm.cameraUrl,
        })
        showToast('Cập nhật đập thủy điện thành công!', 'success')
      } else {
        const payload = {
          name: damForm.name.trim(),
          location: damForm.location.trim(),
          latitude: Number(damForm.latitude),
          longitude: Number(damForm.longitude),
          cameraUrl: damForm.cameraUrl,
        }
        const res = await createDam(payload)
        const newId = res?.dam?.damId || ''
        showToast(`Tạo đập thủy điện thành công! (Mã: ${newId})`, 'success')
      }
      setDamModalOpen(false)
      refetch(true)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSavingDam(false)
    }
  }

  // Delete Confirm Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      setDeletingDam(true)
      await deleteDam(deleteConfirm.id)
      showToast(`Đã xóa đập ${deleteConfirm.name}!`, 'success')
      setDeleteConfirm(null)
      refetch(true)
    } catch (err) {
      showToast(`Lỗi khi xóa: ${err.message}`, 'error')
    } finally {
      setDeletingDam(false)
    }
  }

  // Scope dams and stations for operators
  const visibleDams = isOperator && assignedDamId ? dams.filter(d => d.damId === assignedDamId) : dams
  const visibleStations = isOperator && assignedDamId ? stations.filter(s => s.damId === assignedDamId) : stations

  // Counts per status
  const statusCounts = useMemo(() => ({
    all: visibleDams.length,
    safe: visibleDams.filter(d => d.status === 'safe').length,
    warning: visibleDams.filter(d => d.status === 'warning').length,
    critical: visibleDams.filter(d => d.status === 'critical').length,
    unknown: visibleDams.filter(d => d.status === 'unknown' || !d.status).length,
  }), [visibleDams])

  // Filter dams
  const filteredDams = useMemo(() => {
    return visibleDams.filter(d => {
      if (statusFilter !== 'all') {
        const dStatus = d.status || 'unknown'
        if (dStatus !== statusFilter) return false
      }
      if (!search) return true
      const q = search.toLowerCase()
      return (
        d.name?.toLowerCase().includes(q) ||
        d.damId?.toLowerCase().includes(q) ||
        (d.location && d.location.toLowerCase().includes(q))
      )
    })
  }, [visibleDams, statusFilter, search])

  // Page height: measured from the real distance to the viewport bottom instead of a
  // hardcoded "navbar is 98px" guess, which drifts with zoom/DPI/font metrics and was
  // the actual source of the outer page needing a scroll to reach the pagination bar.
  const pageRef = useRef(null)
  const [pageHeight, setPageHeight] = useState(null)

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (!pageRef.current) return
      const top = pageRef.current.getBoundingClientRect().top
      const h = Math.max(200, Math.floor(window.innerHeight - top))
      setPageHeight(prev => (prev === h ? prev : h))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Items per page: measured dynamically so the list always fits the screen without
  // scrolling — whatever doesn't fit spills onto the next page instead.
  const listBodyRef = useRef(null)
  const gridRef = useRef(null)
  const [itemsPerPage, setItemsPerPage] = useState(showMap ? 9 : 12)

  useLayoutEffect(() => {
    const computeFit = () => {
      const bodyEl = listBodyRef.current
      const gridEl = gridRef.current
      if (!bodyEl || !gridEl) return

      const firstCard = gridEl.querySelector('[data-dam-card]')
      if (!firstCard) return

      const columns = getComputedStyle(gridEl).gridTemplateColumns.split(' ').filter(Boolean).length || 1
      const rowGap = parseFloat(getComputedStyle(gridEl).rowGap) || 0
      const cardHeight = firstCard.getBoundingClientRect().height
      if (!cardHeight) return

      const availableHeight = bodyEl.clientHeight
      const rows = Math.max(1, Math.floor((availableHeight + rowGap) / (cardHeight + rowGap)))
      const count = Math.max(columns, rows * columns)

      setItemsPerPage(prev => (prev === count ? prev : count))
    }

    computeFit()
    const ro = new ResizeObserver(computeFit)
    if (listBodyRef.current) ro.observe(listBodyRef.current)
    window.addEventListener('resize', computeFit)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', computeFit)
    }
  }, [showMap, filteredDams.length, pageHeight])

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, search, showMap])

  // Total pages and paginated items
  const totalPages = Math.ceil(filteredDams.length / itemsPerPage) || 1

  // Clamp current page if it overflows after itemsPerPage / filter changes
  useEffect(() => {
    setCurrentPage(p => Math.min(p, totalPages))
  }, [totalPages])

  const paginatedDams = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredDams.slice(start, start + itemsPerPage)
  }, [filteredDams, currentPage, itemsPerPage])

  return (
    <div
      ref={pageRef}
      style={pageHeight != null ? { height: pageHeight, maxHeight: pageHeight } : undefined}
      className="p-3 h-[calc(100vh-98px)] max-h-[calc(100vh-98px)] flex flex-col gap-3 overflow-hidden select-none font-sans"
    >
      {/* Top Bar / Header */}
      <div className="flex justify-between items-center bg-card border border-border rounded-xl px-4 py-2.5 shadow-panel shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-6 h-6 rounded-lg bg-accent-soft text-accent border border-accent-soft flex items-center justify-center">
              <Database className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-lg font-bold text-tx tracking-wide m-0">{t('damsPage.title')}</h1>
          </div>
          <p className="text-[10px] text-muted m-0">{t('damsPage.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Search */}
          <div className="h-8 flex items-center gap-2 bg-card2 border border-border rounded-lg px-2.5 w-56 shrink-0 focus-within:border-accent transition-colors">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('damsPage.searchPlaceholder')}
              className="bg-transparent border-none outline-none text-tx text-[11px] w-full placeholder:text-muted"
            />
          </div>

          <button
            onClick={() => setShowMap(!showMap)}
            className={`h-8 flex items-center gap-1.5 px-3 border rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${showMap
              ? 'bg-accent/15 text-accent border-accent/40 hover:bg-accent/25'
              : 'bg-card2 text-muted border-border hover:text-tx hover:border-border/80'
              }`}
            title={showMap ? 'Ẩn bản đồ GIS' : 'Hiện bản đồ GIS'}
          >
            {showMap ? <EyeOff className="w-3.5 h-3.5 text-accent" /> : <MapIcon className="w-3.5 h-3.5 text-accent" />}
            <span>{showMap ? 'Ẩn Bản Đồ' : 'Hiện Bản Đồ'}</span>
          </button>

          <button
            onClick={() => refetch()}
            className="h-8 flex items-center gap-1.5 px-3 border border-border rounded-lg text-tx text-[11px] font-semibold bg-card2 hover:bg-white/5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-accent" />
            <span>{t('stationsPage.refresh')}</span>
          </button>

          {isAdmin && (
            <button
              onClick={openCreateDamModal}
              className="h-8 flex items-center gap-1.5 px-3.5 bg-accent hover:bg-accent/90 rounded-md text-white text-[11px] font-bold cursor-pointer border-none shrink-0 whitespace-nowrap transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('damsPage.addDam')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2-COLUMN SPLIT VIEW: TRÁI (BẢN ĐỒ GIS) & PHẢI (DANH SÁCH ĐẬP) ── */}
      <div
        className={
          showMap
            ? "grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch overflow-hidden"
            : "flex-1 min-h-0 flex flex-col overflow-hidden"
        }
      >
        {/* KHỐI TRÁI: BẢN ĐỒ SỐ GIS */}
        {showMap && (
          <div className="lg:col-span-5 xl:col-span-5 h-full bg-card border border-border rounded-xl shadow-panel flex flex-col overflow-hidden">
            {/* Header bản đồ */}
            <div className="px-4 py-2.5 bg-card2/70 border-b border-border/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <MapIcon className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-xs font-bold text-tx uppercase tracking-wider">
                  Bản Đồ Số GIS Định Vị
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-safe/10 border border-safe/20">
                  <LiveDot active />
                  <span className="text-[9px] font-mono text-safe font-bold">LIVE</span>
                </span>
                <button
                  onClick={() => setShowMap(false)}
                  className="p-1 text-muted hover:text-tx hover:bg-white/10 rounded transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1 text-[11px]"
                  title="Ẩn bản đồ GIS"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ẩn</span>
                </button>
              </div>
            </div>

            {/* Thân bản đồ */}
            <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-card2">
              <DamPinMap dams={visibleDams} stations={visibleStations} height="100%" />
            </div>
          </div>
        )}

        {/* KHỐI PHẢI: DANH SÁCH ĐẬP QUẢN LÝ */}
        <div
          className={
            (showMap ? "lg:col-span-7 xl:col-span-7" : "w-full") +
            " h-full bg-card border border-border rounded-xl shadow-panel flex flex-col justify-between overflow-hidden"
          }
        >
          {/* Header danh sách đập */}
          <div className="px-4 py-2.5 bg-card2/70 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-accent" />
              </div>
              <span className="text-xs font-bold text-tx uppercase tracking-wider">
                Danh Sách Đập Quản Lý
              </span>
              <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20 font-bold">
                {filteredDams.length}
              </span>
            </div>

            {/* Filter buttons & Header Pagination */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                ['all', `Tất cả (${statusCounts.all})`],
                ['safe', `An toàn (${statusCounts.safe})`],
                ['warning', `Cảnh báo (${statusCounts.warning})`],
                ['critical', `Nguy cấp (${statusCounts.critical})`],
                ['unknown', `Không xác định (${statusCounts.unknown})`],
              ].map(([id, lb]) => (
                <button
                  key={id}
                  onClick={() => setStatusFilter(id)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                    statusFilter === id
                      ? 'bg-accent/15 border-accent/40 text-accent font-bold shadow-sm'
                      : 'bg-transparent border-border text-muted hover:text-tx hover:bg-white/5'
                  }`}
                >
                  {lb}
                </button>
              ))}

              {!showMap && (
                <button
                  onClick={() => setShowMap(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-accent text-white rounded text-[10px] font-bold transition-all cursor-pointer border-none ml-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>Hiện Bản Đồ</span>
                </button>
              )}

              {/* ── HEADER PAGINATION CONTROLS (ĐẦU DANH SÁCH) ── */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1 bg-card px-1.5 py-0.5 rounded-lg border border-border/80 text-[10px] ml-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 text-muted hover:text-tx disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none flex items-center"
                    title="Trang trước"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-tx px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1 text-muted hover:text-tx disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none flex items-center"
                    title="Trang sau"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Thân danh sách đập (Compact Cards, fit-to-screen, no scroll) */}
          <div ref={listBodyRef} className="flex-1 min-h-0 p-3 overflow-hidden flex flex-col justify-start">
            <div
              ref={gridRef}
              className={
                showMap
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5"
              }
            >
              {paginatedDams.map((dam) => {
                const s = getStatus(dam.status)
                const damStations = visibleStations.filter((st) => st.damId === dam.damId)

                return (
                  <div
                    key={dam.damId}
                    data-dam-card
                    onClick={() => router.push(`/dams/${dam.damId}`)}
                    className={`bg-card2 border border-border border-l-4 ${s.leftBorder} rounded-xl p-2.5 cursor-pointer hover:border-accent/60 hover:-translate-y-0.5 transition-all duration-150 shadow-sm hover:shadow-md group flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <div className="min-w-0 flex-1 mr-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono text-[9px] text-accent bg-accent/10 px-1.5 py-0.2 rounded border border-accent/20 font-bold shrink-0">
                              {dam.damId}
                            </span>
                            <h2 className="text-xs font-bold text-tx group-hover:text-accent transition-colors m-0 truncate" title={dam.name}>
                              {dam.name}
                            </h2>
                          </div>
                          <div className="text-[9px] text-muted flex items-center gap-1 font-mono truncate">
                            <MapPin className="w-2.5 h-2.5 text-muted shrink-0" />
                            <span className="truncate">
                              {dam.latitude != null && dam.longitude != null
                                ? `${dam.latitude}°N, ${dam.longitude}°E`
                                : (dam.location || 'Chưa có tọa độ')}
                              {dam.location && dam.latitude != null ? ` (${dam.location})` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Badge status={dam.status} sm title={dam.statusReason} />
                          {isAdmin && (
                            <div className="flex items-center gap-1 ml-0.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => openEditDamModal(dam, e)}
                                className="p-1 bg-card border border-border rounded text-accent hover:border-accent transition-colors cursor-pointer"
                                title={t('damsPage.editDam')}
                              >
                                <Pencil className="w-3 h-3" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteConfirm({ id: dam.damId, name: dam.name })
                                }}
                                className="p-1 bg-card border border-border rounded text-danger hover:border-danger transition-colors cursor-pointer"
                                title="Xóa Đập"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg my-1.5 border border-border/40">
                        <RadialGauge
                          value={dam.fillPct}
                          size={40}
                          stroke={4}
                          status={dam.status}
                          sublabel=""
                        />
                        <div className="flex-1 min-w-0 text-[9px]">
                          <div className="flex items-baseline justify-between">
                            <span className="text-[8px] text-muted uppercase tracking-wide">
                              {t('damsPage.waterLevel')}
                            </span>
                            <Mono className={`text-[12px] font-bold ${s.text}`}>{dam.waterLevel} m</Mono>
                          </div>
                          <div className="text-[8px] text-muted truncate mt-0.5">
                            Mức chứa: <strong className="text-tx font-mono">{dam.fillPct}%</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer link to stations */}
                    <div className="flex justify-between items-center pt-1 border-t border-border/40 text-[9px]">
                      <div className="flex items-center gap-1 text-muted">
                        <Radio className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>
                          <strong className="text-info">{damStations.length}</strong> trạm
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 text-accent font-bold text-[9px] group-hover:translate-x-0.5 transition-transform">
                        <span>{t('damsPage.viewStations', { count: damStations.length })}</span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredDams.length === 0 && (
                <div className="col-span-full text-center py-16 bg-card2/50 border border-border rounded-xl text-muted text-xs shadow-sm">
                  Không tìm thấy đập thủy điện nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.
                </div>
              )}
            </div>
          </div>

          {/* ── PAGINATION FOOTER ── */}
          {filteredDams.length > 0 && (
            <div className="px-4 py-2 bg-card2/50 border-t border-border/70 flex items-center justify-between shrink-0 text-xs">
              <div className="text-muted font-mono text-[11px]">
                Hiển thị <strong className="text-tx">{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
                <strong className="text-tx">{Math.min(currentPage * itemsPerPage, filteredDams.length)}</strong>{' '}
                / <strong className="text-accent">{filteredDams.length}</strong> đập
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="p-1 px-2 rounded-md border border-border text-tx bg-card hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-6 h-6 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                          currentPage === pageNum
                            ? 'bg-accent text-white border-accent shadow-sm'
                            : 'bg-card border-border text-muted hover:text-tx hover:bg-card2'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="p-1 px-2 rounded-md border border-border text-tx bg-card hover:bg-card2 disabled:opacity-40 disabled:cursor-not-allowed text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── MODAL: CREATE / EDIT DAM (SPLIT-VIEW) ── */}
      <Modal
        open={damModalOpen}
        onClose={() => setDamModalOpen(false)}
        title={editingDam ? t('damsPage.editDam') : t('damsPage.addDam')}
        icon={Database}
        maxWidth="max-w-4xl"
        footer={
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setDamModalOpen(false)}>
              {t('admin.cancel')}
            </Button>
            <Button type="submit" form="dam-form" variant="primary" loading={savingDam}>
              {editingDam ? t('admin.save') : t('admin.create')}
            </Button>
          </FormActions>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* CỘT TRÁI: Form nhập liệu */}
          <form id="dam-form" onSubmit={handleSaveDam} className="md:col-span-6 space-y-3">
            <Field label="Mã Đập Thủy Điện (ID)" hint="Tự động sinh bởi Backend">
              <TextInput
                icon={Lock}
                disabled
                readOnly
                value={editingDam ? damForm.id : '(Tự động sinh bởi Backend)'}
                className="font-mono cursor-not-allowed select-none"
              />
            </Field>

            <Field label={t('admin.form.damNameLabel')} required error={damErrors.name} htmlFor="dam-name">
              <TextInput
                id="dam-name"
                required
                autoFocus
                error={damErrors.name}
                value={damForm.name}
                onChange={e => {
                  setDamForm(p => ({ ...p, name: e.target.value }))
                  if (damErrors.name) setDamErrors(p => ({ ...p, name: null }))
                }}
                placeholder="vd: Đập Thủy điện Hòa Bình"
              />
            </Field>

            <Field label="Địa danh / Vị trí hành chính" htmlFor="dam-location">
              <TextInput
                id="dam-location"
                value={damForm.location}
                onChange={e => setDamForm(p => ({ ...p, location: e.target.value }))}
                placeholder="vd: Hòa Bình"
              />
            </Field>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Vĩ độ (Latitude °N)" required error={damErrors.latitude} htmlFor="dam-lat">
                <TextInput
                  id="dam-lat"
                  type="number"
                  step="0.0001"
                  required
                  error={damErrors.latitude}
                  value={damForm.latitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, latitude: e.target.value }))
                    if (damErrors.latitude) setDamErrors(p => ({ ...p, latitude: null }))
                  }}
                  placeholder="vd: 20.8167"
                  className="font-mono"
                />
              </Field>
              <Field label="Kinh độ (Longitude °E)" required error={damErrors.longitude} htmlFor="dam-lng">
                <TextInput
                  id="dam-lng"
                  type="number"
                  step="0.0001"
                  required
                  error={damErrors.longitude}
                  value={damForm.longitude}
                  onChange={e => {
                    setDamForm(p => ({ ...p, longitude: e.target.value }))
                    if (damErrors.longitude) setDamErrors(p => ({ ...p, longitude: null }))
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

          {/* CỘT PHẢI: Bản đồ chọn tọa độ + Live Preview Card */}
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
                        {editingDam ? damForm.id : 'MÃ TỰ ĐỘNG'}
                      </span>
                      <h4 className="text-sm font-bold text-tx truncate m-0">
                        {damForm.name || 'Tên Đập Thủy Điện'}
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
                  <Badge status="unknown" sm title="Đập mới tạo chưa có trạm kết nối" />
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
            <Button variant="danger" loading={deletingDam} onClick={handleConfirmDelete}>
              {t('admin.confirmDelete')}
            </Button>
          </FormActions>
        }
      >
        <p className="text-[10px] text-muted m-0">{t('admin.deleteWarning')}</p>
        <p className="text-[11px] text-tx leading-relaxed bg-card2 p-3 rounded-lg border border-border">
          Xóa Đập thủy điện <strong className="text-danger">{deleteConfirm?.name}</strong> (ID: {deleteConfirm?.id})?
          <span className="flex items-center gap-1 text-[10px] text-warning mt-1">
            <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
            <span>{t('admin.deleteDamNotice')}</span>
          </span>
        </p>
      </Modal>
    </div>
  )
}
